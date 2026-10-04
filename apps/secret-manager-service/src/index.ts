import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRouter } from './routers/auth';

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

const allowedOrigins = ['http://localhost:3000'];

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      return allowedOrigins.includes(origin) ? origin : '';
    },
    credentials: true,
  }),
);

app.route('/auth', authRouter);

app.get('/', (c) => {
  return c.text('Hello from Hono on Cloudflare Workers inside Nx!');
});

export default app;
