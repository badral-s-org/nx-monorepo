import { getCookie, setCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { getDB } from '../configs/drizzleProvider';
import { SuperKeyActions, SuperKeys } from '../db';

export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
export const ACCESS_TOKEN_MAX_AGE = 60 * 15;

type UserPayload = {
  id: string;
  email: string;
};

type JwtPayload = {
  user: UserPayload;
  iat?: number;
  exp?: number;
};

const getTokenSecret = (): string => {
  const secret = process.env.TOKEN_SECRET;

  if (!secret) {
    throw new Error('TOKEN_SECRET is not configured');
  }

  return secret;
};

export const generateToken = (user: any): string => {
  return jwt.sign({ user }, getTokenSecret(), {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (user: any): string => {
  return jwt.sign({ user }, getTokenSecret(), {
    algorithm: 'HS256',
    expiresIn: '30d',
  });
};

export const isLoggedIn = async (c: Context<AppEnv>, next: Next) => {
  const accessToken = getCookie(c, 'access_token');
  const refreshToken = getCookie(c, 'refresh_token');

  const unauthorized: ApiResponse = {
    data: null,
    message: 'Unauthorized',
    statusCode: 401,
    success: false,
  };
  console.log('hello1');
  if (!accessToken && !refreshToken) {
    return c.json(unauthorized, 401);
  }
  console.log('hello2');
  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, getTokenSecret(), {
        algorithms: ['HS256'],
      }) as JwtPayload;

      c.set('user', payload.user);
      return await next();
    } catch (error) {
      if (!(error instanceof jwt.TokenExpiredError)) {
        return c.json(unauthorized, 401);
      }
    }
  }
  console.log('hello3');
  if (!refreshToken) {
    return c.json(unauthorized, 401);
  }

  console.log('hello4');
  try {
    const payload = jwt.verify(refreshToken, getTokenSecret(), {
      algorithms: ['HS256'],
    }) as JwtPayload;

    const newAccessToken = generateToken(payload.user);

    setCookie(c, 'access_token', newAccessToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    c.set('user', payload.user);
    return await next();
  } catch {
    // deleteCookie(c, 'access_token', { path: '/' });
    // deleteCookie(c, 'refresh_token', { path: '/' });

    return c.json(unauthorized, 401);
  }
};

export const hashApiKey = async (apiKey: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(apiKey),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

// For other services: expects "Authorization: Bearer <api key>".
// super_keys.key stores the SHA-256 hex hash of the api key, never the key itself.
export const isServiceAuthorized = async (
  c: Context<{ Bindings: Bindings }>,
  next: Next,
) => {
  const unauthorized: ApiResponse = {
    data: null,
    message: 'Unauthorized',
    statusCode: 401,
    success: false,
  };

  const header = c.req.header('Authorization');

  if (!header?.startsWith('Bearer ')) {
    return c.json(unauthorized, 401);
  }

  const apiKey = header.slice('Bearer '.length).trim();

  if (!apiKey) {
    return c.json(unauthorized, 401);
  }

  const DB = getDB(c.env);

  const superKey = await DB.query.SuperKeys.findFirst({
    where: eq(SuperKeys.key, await hashApiKey(apiKey)),
  });

  if (!superKey || !superKey.accessActions.includes(SuperKeyActions.READ)) {
    return c.json(unauthorized, 401);
  }

  return await next();
};
