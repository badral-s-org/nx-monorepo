import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDB } from '../configs/drizzleProvider';
import { Users } from '../db';
import { sendEmail } from '../utils/send-email';
import { sha256Hex } from '../utils/encoder';
import { fail, ok } from '../utils/response';
import { validate } from '../utils/validate';
import type { AppEnv } from '../types';

import {
  clearSessionCookies,
  isLoggedIn,
  setSessionCookies,
} from '../utils/auth';

const OTP_TTL_MS = 1000 * 60 * 5;
const OTP_RESEND_COOLDOWN_MS = 1000 * 60;
const OTP_MAX_ATTEMPTS = 5;

const emailSchema = z.string().trim().toLowerCase().email().max(254);

const generateOtp = () => {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return (value % 1_000_000).toString().padStart(6, '0');
};

const findUserByEmail = async (DB: ReturnType<typeof getDB>, email: string) => {
  const [user] = await DB.select()
    .from(Users)
    .where(sql`lower(${Users.email}) = ${email}`);

  return user;
};

export const authRouter = new Hono<AppEnv>();

authRouter.post(
  '/send-otp',
  validate('json', z.object({ email: emailSchema })),
  async (c) => {
    const DB = getDB(c.env);
    const { email } = c.req.valid('json');

    const user = await findUserByEmail(DB, email);

    if (!user) {
      return fail(c, 'User not found and Please ask admin about that.', 404);
    }

    const now = Date.now();

    if (
      user.otpExpiration &&
      user.otpExpiration - OTP_TTL_MS + OTP_RESEND_COOLDOWN_MS > now
    ) {
      return fail(
        c,
        'An OTP code was sent recently. Please wait a minute before requesting a new one.',
        429,
      );
    }

    const otp = generateOtp();

    await DB.update(Users)
      .set({
        otpCode: await sha256Hex(otp),
        otpExpiration: now + OTP_TTL_MS,
        otpAttempts: 0,
      })
      .where(eq(Users.id, user.id));

    try {
      await sendEmail(c.env, {
        to: user.email,
        content: `<p>Your Secret Manager OTP code is <b>${otp}</b>. It expires in 5 minutes.</p>`,
        subject: 'Secret Manager OTP code',
      });
    } catch (error) {
      // Release the code so the cooldown does not block a retry.
      await DB.update(Users)
        .set({ otpCode: null, otpExpiration: null })
        .where(eq(Users.id, user.id));
      throw error;
    }

    return ok(
      c,
      null,
      'OTP Code is sent successfully. Please check your email.',
    );
  },
);

authRouter.post(
  '/verify-otp',
  validate(
    'json',
    z.object({
      email: emailSchema,
      otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    }),
  ),
  async (c) => {
    const DB = getDB(c.env);
    const { email, otp } = c.req.valid('json');

    const user = await findUserByEmail(DB, email);

    if (
      !user ||
      !user.otpCode ||
      !user.otpExpiration ||
      user.otpExpiration < Date.now()
    ) {
      return fail(c, 'OTP is invalid or has expired', 400);
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      await DB.update(Users)
        .set({ otpCode: null, otpExpiration: null, otpAttempts: 0 })
        .where(eq(Users.id, user.id));

      return fail(c, 'Too many attempts. Please request a new OTP code.', 429);
    }

    if (user.otpCode !== (await sha256Hex(otp))) {
      await DB.update(Users)
        .set({ otpAttempts: sql`${Users.otpAttempts} + 1` })
        .where(eq(Users.id, user.id));

      return fail(c, 'OTP is wrong', 400);
    }

    // One time use: clear the code so it can not be replayed.
    await DB.update(Users)
      .set({ otpCode: null, otpExpiration: null, otpAttempts: 0 })
      .where(eq(Users.id, user.id));

    const sessionUser = { id: user.id, email: user.email };

    await setSessionCookies(c, sessionUser);

    return ok(c, sessionUser, 'Successfully signed in');
  },
);

authRouter.post('/logout', (c) => {
  clearSessionCookies(c);
  return ok(c, null, 'Successfully signed out');
});

authRouter.get('/session', isLoggedIn, (c) => {
  return ok(c, c.get('user'), 'Successfully fetched');
});
