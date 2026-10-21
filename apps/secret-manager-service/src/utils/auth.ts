import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { JwtTokenExpired } from 'hono/utils/jwt/types';
import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import type { CookieOptions } from 'hono/utils/cookie';
import { getDB } from '../configs/drizzleProvider';
import { SuperKeyActions, SuperKeys } from '../db';
import type { AppEnv, Bindings, SessionUser } from '../types';
import { sha256Hex } from './encoder';
import { fail } from './response';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const ACCESS_TOKEN_MAX_AGE = 60 * 15;
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

type TokenType = 'access' | 'refresh';

type TokenPayload = {
  sub: number;
  email: string;
  type: TokenType;
  iat: number;
  exp: number;
};

const getTokenSecret = (env: Bindings): string => {
  if (!env.TOKEN_SECRET || env.TOKEN_SECRET.length < 32) {
    throw new Error(
      'TOKEN_SECRET must be configured with at least 32 characters',
    );
  }

  return env.TOKEN_SECRET;
};

const signToken = (env: Bindings, user: SessionUser, type: TokenType) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    type,
    iat: now,
    exp:
      now + (type === 'access' ? ACCESS_TOKEN_MAX_AGE : REFRESH_TOKEN_MAX_AGE),
  };

  return sign(payload, getTokenSecret(env), 'HS256');
};

// Throws when the token is invalid, expired or of a different type, so a
// refresh token can never be used as an access token and vice versa.
const verifyToken = async (
  env: Bindings,
  token: string,
  type: TokenType,
): Promise<SessionUser> => {
  const payload = (await verify(
    token,
    getTokenSecret(env),
    'HS256',
  )) as Partial<TokenPayload>;

  if (
    payload.type !== type ||
    typeof payload.sub !== 'number' ||
    typeof payload.email !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  return { id: payload.sub, email: payload.email };
};

// The web app proxies /api to this worker, so the cookies are first party and
// can use SameSite=Lax. Secure is only dropped for plain http local development.
const cookieOptions = (c: Context, maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: new URL(c.req.url).protocol === 'https:',
  sameSite: 'Lax',
  path: '/',
  maxAge,
});

const setAccessCookie = async (c: Context<AppEnv>, user: SessionUser) => {
  setCookie(
    c,
    ACCESS_TOKEN_COOKIE,
    await signToken(c.env, user, 'access'),
    cookieOptions(c, ACCESS_TOKEN_MAX_AGE),
  );
};

export const setSessionCookies = async (
  c: Context<AppEnv>,
  user: SessionUser,
) => {
  await setAccessCookie(c, user);
  setCookie(
    c,
    REFRESH_TOKEN_COOKIE,
    await signToken(c.env, user, 'refresh'),
    cookieOptions(c, REFRESH_TOKEN_MAX_AGE),
  );
};

export const clearSessionCookies = (c: Context<AppEnv>) => {
  const { secure } = cookieOptions(c, 0);
  deleteCookie(c, ACCESS_TOKEN_COOKIE, { path: '/', secure });
  deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: '/', secure });
};

export const isLoggedIn = async (c: Context<AppEnv>, next: Next) => {
  const accessToken = getCookie(c, ACCESS_TOKEN_COOKIE);
  const refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE);

  if (accessToken) {
    try {
      c.set('user', await verifyToken(c.env, accessToken, 'access'));
      return await next();
    } catch (error) {
      // An expired access token falls through to the refresh token below.
      if (!(error instanceof JwtTokenExpired)) {
        clearSessionCookies(c);
        return fail(c, 'Unauthorized', 401);
      }
    }
  }

  if (!refreshToken) {
    return fail(c, 'Unauthorized', 401);
  }

  let user: SessionUser;

  try {
    user = await verifyToken(c.env, refreshToken, 'refresh');
  } catch {
    clearSessionCookies(c);
    return fail(c, 'Unauthorized', 401);
  }

  await setAccessCookie(c, user);
  c.set('user', user);
  return await next();
};

// For other services: expects "Authorization: Bearer <api key>".
// super_keys.key stores the SHA-256 hex hash of the api key, never the key itself.
export const isServiceAuthorized = async (c: Context<AppEnv>, next: Next) => {
  const header = c.req.header('Authorization');
  const apiKey = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : '';

  if (!apiKey) {
    return fail(c, 'Unauthorized', 401);
  }

  const DB = getDB(c.env);

  const superKey = await DB.query.SuperKeys.findFirst({
    where: eq(SuperKeys.key, await sha256Hex(apiKey)),
  });

  if (!superKey || !superKey.accessActions.includes(SuperKeyActions.READ)) {
    return fail(c, 'Unauthorized', 401);
  }

  return await next();
};
