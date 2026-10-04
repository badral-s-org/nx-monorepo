import { Hono } from 'hono';
import { getDB } from '../configs/drizzleProvider';
import { Users } from '../db';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../utils/send-email';
import { setCookie } from 'hono/cookie';
import type { Context } from 'hono';

import {
  ACCESS_TOKEN_MAX_AGE,
  generateToken,
  isLoggedIn,
  REFRESH_TOKEN_MAX_AGE,
} from '../utils/auth';

export const authRouter = new Hono<{ Bindings: Bindings }>();

authRouter.post('/send-otp', async (c) => {
  const response: ApiResponse = {};
  try {
    const DB = getDB(c.env);

    const { email } = await c.req.json();

    const [user] = await DB.select().from(Users).where(eq(Users.email, email));

    if (!user) {
      response.data = null;
      response.message = 'User not found and Please ask admin about that.';
      response.statusCode = 404;
      response.success = false;
      return c.json(response, 404);
    }

    const otp = Math.floor(Math.random() * 900000 + 100000);

    await DB.update(Users)
      .set({
        otpCode: otp.toString(),
        otpExpiration: Date.now() + 1000 * 120,
      })
      .where(eq(Users.id, user.id));

    await sendEmail({
      to: email,
      content: `<p>OTP Code <b>${otp}</b></p>`,
      subject: 'SECRET_MANAGER_WEB OTP code',
    });

    response.success = true;
    response.data = null;
    response.message =
      'OTP Code is sent successfully. Please check your email.';
    response.statusCode = 200;

    return c.json(response, response.statusCode);
  } catch (error) {
    return c.json(
      {
        success: false,
        data: null,
        message: 'Internal server error.',
        statusCode: 500,
      },
      500,
    );
  }
});

authRouter.post('/verify-otp', async (c) => {
  const response: ApiResponse = {};

  try {
    const DB = getDB(c.env);

    const { email, otp } = await c.req.json();

    const [user] = await DB.select().from(Users).where(eq(Users.email, email));

    if (!user) {
      response.data = null;
      response.message = 'User not found';
      response.statusCode = 404;
      response.success = false;
      return c.json(response, response.statusCode);
    }

    if (!user.otpCode) {
      response.data = null;
      response.message = 'There is no otp sent';
      response.statusCode = 404;
      response.success = false;
      return c.json(response, response.statusCode);
    }

    if (!user.otpExpiration || user.otpExpiration < Date.now()) {
      response.data = null;
      response.message = 'OTP has expired';
      response.statusCode = 400;
      response.success = false;
      return c.json(response, response.statusCode);
    }

    if (user.otpCode !== otp) {
      response.data = null;
      response.message = 'OTP is wrong';
      response.statusCode = 400;
      response.success = false;
      return c.json(response, response.statusCode);
    }

    // await DB.update(Users)
    //   .set({ otpExpiration: null })
    //   .where(eq(Users.email, email));

    const ACCESS_TOKEN = generateToken(user);

    const REFRESH_TOKEN = generateToken(user);

    setCookie(c, 'access_token', ACCESS_TOKEN, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    setCookie(c, 'refresh_token', REFRESH_TOKEN, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    response.data = { id: user.id, email: user.email };
    response.message = 'Successfully signed in';

    response.statusCode = 200;
    response.success = true;

    return c.json(response, response.statusCode);
  } catch (error) {
    console.log(error);
    return c.json(
      {
        success: false,
        data: null,
        message: 'Internal server error',
        statusCode: 500,
      },
      500,
    );
  }
});

authRouter.get('/session', isLoggedIn, async (c: Context<AppEnv>) => {
  const response: ApiResponse = {};
  console.log('api');
  const user = c.get('user');

  response.data = user;

  response.message = 'Successfully fetched';

  response.statusCode = 200;

  response.success = true;

  return c.json(response, response.statusCode);
});
