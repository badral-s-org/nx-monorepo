import { Hono } from 'hono';
import { isLoggedIn } from '../utils/auth';
import { getDB } from '../configs/drizzleProvider';
import { decryptSecret, encryptSecret } from '../utils/encoder';
import { Groups, Secrets, SecretType } from '../db';
import { eq } from 'drizzle-orm';

export const secretRouter = new Hono<{ Bindings: Bindings }>();

secretRouter.get('/get-secrets', isLoggedIn, async (c) => {
  const DB = getDB(c.env);

  try {
    const groups = await DB.query.Groups.findMany({
      with: {
        secrets: true,
      },
    });

    const decryptedGroups = groups.map(async (group) => ({
      ...group,
      secrets: await Promise.all(
        group.secrets.map(async (secret) => ({
          id: secret.id,
          groupId: secret.groupId,
          createdAt: secret.createdAt,
          updatedAt: secret.updatedAt,
          key: secret.key,
          secret: await decryptSecret({
            iv: secret.iv,
            secret: secret.secret,
          }),
        })),
      ),
    }));

    const response: ApiResponse = {
      data: decryptedGroups,
      message: 'Successfully fetched',
      statusCode: 200,
      success: true,
    };

    return c.json(response, 200);
  } catch (error) {
    console.error('Failed to fetch secrets:', error);

    const response: ApiResponse = {
      data: null,
      message: 'Something went wrong!',
      statusCode: 500,
      success: false,
    };

    return c.json(response, 500);
  }
});

secretRouter.post('/put-secrets', isLoggedIn, async (c) => {
  try {
    const DB = getDB(c.env);

    const { groupId, secrets } = await c.req.json();

    const encryptedSecrets = await Promise.all(
      secrets.map(async (secret: SecretType) => {
        const encryptedValue = await encryptSecret(secret.secret);

        return {
          ...secret,
          groupId,
          secret: encryptedValue.ciphertext,
          iv: encryptedValue.iv,
        };
      }),
    );

    const [group] = await DB.select()
      .from(Groups)
      .where(eq(Groups.id, groupId));

    if (!group) {
      return c.json(
        {
          data: null,
          success: false,
          message: 'Group not found!',
        },
        404,
      );
    }

    await Promise.all(
      encryptedSecrets.map((secret) =>
        DB.insert(Secrets).values({ ...secret }),
      ),
    );

    return c.json(
      {
        data: null,
        message: 'Successfully put secrets',
        success: true,
      },
      200,
    );
  } catch (error) {
    console.log(error);

    return c.json(
      {
        data: null,
        message: 'Internal Server Error!',
        success: false,
      },
      500,
    );
  }
});

secretRouter.put('/update-secret/:id', isLoggedIn, async (c) => {
  const DB = getDB(c.env);
  const id = c.req.param('id') ? Number(c.req.param('id')) : 0;

  const { value, key } = await c.req.json();
  try {
    const secret = await DB.query.Secrets.findFirst({
      where: eq(Secrets.id, id),
    });

    const response: ApiResponse = {};

    if (!secret) {
      response.data = null;
      response.message = 'secret not found';
      response.statusCode = 404;
      response.success = false;

      return c.json(response, response.statusCode);
    }

    const { ciphertext, iv } = await encryptSecret(value);

    const updated = await DB.update(Secrets)
      .set({ iv: iv + '', secret: ciphertext + '', key })
      .where(eq(Secrets.id, id))
      .returning()
      .get();

    response.data = updated;
    response.message = 'Successfully updated';
    response.statusCode = 200;
    response.success = true;
    return c.json(response, response.statusCode);
  } catch (error) {
    console.log(error);
    const response: ApiResponse = {};
    response.data = null;
    response.message = 'Interval Server Error !';
    response.statusCode = 500;
    response.success = false;
    return c.json(response, response.statusCode);
  }
});
