import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type Bindings = {
  DB: D1Database;
  ENVIRONMENT: 'development' | 'production';
  // Comma separated list of web origins allowed to call the API from a browser.
  ALLOWED_ORIGINS: string;
  EMAIL_FROM: string;
  TOKEN_SECRET: string;
  SUPER_KEY: string;
  RESEND_API_KEY: string;
};

export type SessionUser = {
  id: number;
  email: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    user: SessionUser;
  };
};

export type ApiResponse<T = unknown> = {
  message: string;
  statusCode: ContentfulStatusCode;
  success: boolean;
  data: T | null;
};
