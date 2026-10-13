import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import type { Context, Next } from 'hono';

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

  if (!accessToken && !refreshToken) {
    return c.json(unauthorized, 401);
  }

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

  if (!refreshToken) {
    return c.json(unauthorized, 401);
  }

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
