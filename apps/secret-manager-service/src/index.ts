import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { Context } from 'hono';
import { authRouter } from './routers/auth';
import { secretRouter } from './routers/secret';
import { fail, ok } from './utils/response';
import type { AppEnv } from './types';

const DEV_ORIGINS = ['http://localhost:3000'];

const isAllowedOrigin = (origin: string, c: Context<AppEnv>) => {
  const allowed = (c.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (c.env.ENVIRONMENT !== 'production') {
    allowed.push(...DEV_ORIGINS);
  }

  return allowed.includes(origin);
};

const app = new Hono<AppEnv>().basePath('/api');

app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: (origin, c) => (isAllowedOrigin(origin, c) ? origin : null),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }),
);
app.use('*', csrf({ origin: isAllowedOrigin }));
app.use(
  '*',
  bodyLimit({
    maxSize: 1024 * 1024,
    onError: (c) => fail(c, 'Request body is too large', 413),
  }),
);

app.route('/auth', authRouter);

app.route('/secrets', secretRouter);

app.get('/health', (c) => ok(c, { status: 'ok' }, 'Healthy'));

app.notFound((c) => fail(c, 'Not found', 404));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  console.error(`${c.req.method} ${c.req.path} failed:`, error);
  return fail(c, 'Internal server error', 500);
});

export default app;
