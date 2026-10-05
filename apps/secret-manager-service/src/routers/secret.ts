import { Hono } from 'hono';
import { isLoggedIn } from '../utils/auth';
import { getDB } from '../configs/drizzleProvider';
import { encryptSecret } from '../utils/encoder';
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

    const response: ApiResponse = {
      data: groups,
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

secretRouter.put('/update-secret', isLoggedIn, (c) => {
  const DB = getDB(c.env);
  try {
  } catch (error) {}
});
