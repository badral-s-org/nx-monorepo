import { Hono } from 'hono';
import { and, asc, eq, inArray, ne, notExists } from 'drizzle-orm';
import { z } from 'zod';
import { isLoggedIn, isServiceAuthorized } from '../utils/auth';
import { getDB } from '../configs/drizzleProvider';
import { decryptSecret, encryptSecret } from '../utils/encoder';
import { Groups, Secrets, SecretType } from '../db';
import { fail, ok } from '../utils/response';
import { validate } from '../utils/validate';
import type { AppEnv } from '../types';

const MAX_SECRETS_PER_REQUEST = 50;

const idSchema = z.coerce.number().int().positive();
const keySchema = z
  .string()
  .trim()
  .min(1, 'Key is required')
  .max(256)
  .regex(/^[A-Za-z0-9_.-]+$/, 'Key may only contain letters, digits, _ . -');
const valueSchema = z
  .string()
  .min(1, 'Value is required')
  .max(64 * 1024);

const decryptSecrets = (superKey: string, secrets: SecretType[]) =>
  Promise.all(
    secrets.map(async (secret) => ({
      id: secret.id,
      groupId: secret.groupId,
      createdAt: secret.createdAt,
      updatedAt: secret.updatedAt,
      key: secret.key,
      secret: await decryptSecret(superKey, secret),
    })),
  );

export const secretRouter = new Hono<AppEnv>();

// Lists groups with their secret keys only. Values are returned by the single
// group endpoint so the overview never ships every secret to the browser.
secretRouter.get('/get-secrets', isLoggedIn, async (c) => {
  const DB = getDB(c.env);

  const groups = await DB.query.Groups.findMany({
    orderBy: asc(Groups.name),
    with: {
      secrets: {
        columns: { id: true, key: true, createdAt: true, updatedAt: true },
        orderBy: asc(Secrets.key),
      },
    },
  });

  return ok(c, groups, 'Successfully fetched');
});

secretRouter.get(
  '/get-secrets/:id',
  isLoggedIn,
  validate('param', z.object({ id: idSchema })),
  async (c) => {
    const DB = getDB(c.env);
    const { id } = c.req.valid('param');

    const group = await DB.query.Groups.findFirst({
      where: eq(Groups.id, id),
      with: {
        secrets: { orderBy: asc(Secrets.key) },
      },
    });

    if (!group) {
      return fail(c, 'Group not found', 404);
    }

    return ok(
      c,
      {
        ...group,
        secrets: await decryptSecrets(c.env.SUPER_KEY, group.secrets),
      },
      'Successfully fetched',
    );
  },
);

secretRouter.get(
  '/env/:group',
  isServiceAuthorized,
  validate('param', z.object({ group: z.string().min(1).max(100) })),
  async (c) => {
    const DB = getDB(c.env);
    const { group: groupName } = c.req.valid('param');

    const group = await DB.query.Groups.findFirst({
      where: eq(Groups.name, groupName),
      with: {
        secrets: true,
      },
    });

    if (!group) {
      return fail(c, 'Group not found', 404);
    }

    const env: Record<string, string> = {};

    for (const secret of group.secrets) {
      env[secret.key] = await decryptSecret(c.env.SUPER_KEY, secret);
    }

    return ok(c, env, 'Successfully fetched');
  },
);

secretRouter.post(
  '/put-secrets',
  isLoggedIn,
  validate(
    'json',
    z.object({
      groupId: idSchema,
      secrets: z
        .array(z.object({ key: keySchema, secret: valueSchema }))
        .min(1, 'At least one secret is required')
        .max(MAX_SECRETS_PER_REQUEST),
    }),
  ),
  async (c) => {
    const DB = getDB(c.env);
    const { groupId, secrets } = c.req.valid('json');

    const keys = secrets.map((secret) => secret.key);

    if (new Set(keys).size !== keys.length) {
      return fail(c, 'Secret keys must be unique', 400);
    }

    const [group] = await DB.select()
      .from(Groups)
      .where(eq(Groups.id, groupId));

    if (!group) {
      return fail(c, 'Group not found!', 404);
    }

    const existing = await DB.select({ key: Secrets.key })
      .from(Secrets)
      .where(and(eq(Secrets.groupId, groupId), inArray(Secrets.key, keys)));

    if (existing.length > 0) {
      return fail(
        c,
        `Secret already exists: ${existing.map((secret) => secret.key).join(', ')}`,
        409,
      );
    }

    const values = await Promise.all(
      secrets.map(async (secret) => ({
        groupId,
        key: secret.key,
        ...(await encryptSecret(c.env.SUPER_KEY, secret.secret)),
      })),
    );

    // A single statement, so either all secrets are stored or none are.
    await DB.insert(Secrets).values(values);

    return ok(c, null, 'Successfully put secrets');
  },
);

secretRouter.put(
  '/update-secret/:id',
  isLoggedIn,
  validate('param', z.object({ id: idSchema })),
  validate('json', z.object({ key: keySchema, value: valueSchema })),
  async (c) => {
    const DB = getDB(c.env);
    const { id } = c.req.valid('param');
    const { key, value } = c.req.valid('json');

    const secret = await DB.query.Secrets.findFirst({
      where: eq(Secrets.id, id),
    });

    if (!secret) {
      return fail(c, 'secret not found', 404);
    }

    const conflict = await DB.query.Secrets.findFirst({
      where: and(
        eq(Secrets.groupId, secret.groupId),
        eq(Secrets.key, key),
        ne(Secrets.id, id),
      ),
    });

    if (conflict) {
      return fail(c, `Secret already exists: ${key}`, 409);
    }

    const updated = await DB.update(Secrets)
      .set({ key, ...(await encryptSecret(c.env.SUPER_KEY, value)) })
      .where(eq(Secrets.id, id))
      .returning({
        id: Secrets.id,
        groupId: Secrets.groupId,
        key: Secrets.key,
        createdAt: Secrets.createdAt,
        updatedAt: Secrets.updatedAt,
      })
      .get();

    return ok(c, updated, 'Successfully updated');
  },
);

secretRouter.post(
  '/create-group',
  isLoggedIn,
  validate(
    'json',
    z.object({
      groupName: z.string().trim().min(1, 'Group name is required').max(100),
    }),
  ),
  async (c) => {
    const DB = getDB(c.env);
    const { groupName } = c.req.valid('json');

    const group = await DB.query.Groups.findFirst({
      where: eq(Groups.name, groupName),
    });

    if (group) {
      return fail(c, 'Group already exists', 409);
    }

    const addedGroup = await DB.insert(Groups)
      .values({ name: groupName })
      .returning()
      .get();

    return ok(c, addedGroup, 'Successfully added');
  },
);

// Only empty groups can be deleted, so secrets are never removed implicitly.
secretRouter.delete(
  '/delete-group/:id',
  isLoggedIn,
  validate('param', z.object({ id: idSchema })),
  async (c) => {
    const DB = getDB(c.env);
    const { id } = c.req.valid('param');

    // The emptiness check is part of the delete statement so a secret added
    // concurrently can not be orphaned.
    const deleted = await DB.delete(Groups)
      .where(
        and(
          eq(Groups.id, id),
          notExists(
            DB.select({ id: Secrets.id })
              .from(Secrets)
              .where(eq(Secrets.groupId, id)),
          ),
        ),
      )
      .returning({ id: Groups.id });

    if (deleted.length > 0) {
      return ok(c, null, 'Successfully deleted group');
    }

    const group = await DB.query.Groups.findFirst({
      where: eq(Groups.id, id),
    });

    if (!group) {
      return fail(c, 'Group not found', 404);
    }

    return fail(c, 'Only groups without secrets can be deleted', 409);
  },
);

secretRouter.delete(
  '/delete-secrets',
  isLoggedIn,
  validate(
    'json',
    z.object({
      secrets: z.array(idSchema).min(1).max(MAX_SECRETS_PER_REQUEST),
    }),
  ),
  async (c) => {
    const DB = getDB(c.env);
    const { secrets } = c.req.valid('json');

    await DB.delete(Secrets).where(inArray(Secrets.id, secrets));

    return ok(c, null, 'Successfully Deleted');
  },
);
