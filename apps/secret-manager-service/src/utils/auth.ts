import { getCookie, setCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import type { Context, Next } from 'hono';

export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
export const ACCESS_TOKEN_MAX_AGE = 60 * 15;

export const generateToken = (user: any) => {
  const token = jwt.sign({ user }, process.env.TOKEN_SECRET ?? '', {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
  return token;
};

export const generateRefreshToken = (user: any) => {
  const token = jwt.sign({ user }, process.env.TOKEN_SECRET ?? '', {
    algorithm: 'HS256',
    expiresIn: '30d',
  });
  return token;
};

export const isLoggedIn = async (c: Context<AppEnv>, next: Next) => {
  const accessToken = getCookie(c, 'access_token');
  const refreshToken = getCookie(c, 'refresh_token');

  const response: ApiResponse = {
    data: null,
    message: 'Unauthorized',
    statusCode: 401,
    success: false,
  };

  if (!accessToken) {
    return c.json(response, response.statusCode);
  }

  try {
    const payload: any = jwt.verify(
      accessToken,
      process.env.TOKEN_SECRET ?? '',
      { algorithms: ['HS256'] },
    );

    c.set('user', payload.user);

    return await next();
  } catch (error) {
    if (!(error instanceof jwt.TokenExpiredError)) {
      return c.json(response, response.statusCode);
    }
  }

  // Access token expired → refresh token
  if (!refreshToken) {
    return c.json(response, response.statusCode);
  }

  try {
    const payload: any = jwt.verify(
      refreshToken,
      process.env.TOKEN_SECRET ?? '',
      { algorithms: ['HS256'] },
    );

    const newAccessToken = generateToken(payload.user);

    setCookie(c, 'access_token', newAccessToken, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    c.set('user', payload.user);

    return await next();
  } catch {
    return c.json(response, response.statusCode);
  }
};
