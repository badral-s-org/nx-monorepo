type Context = {
  env: Env;
};

type Env = {
  DB: D1Database;
};

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
  TOKEN_SECRET: string;
  SUPER_KEY: string;
  RESEND_API_KEY: string;
};

type ApiResponse = {
  message?: string;
  statusCode?: ContentfulStatusCode;
  success?: boolean;
  data?: T;
};

type AppEnv = {
  Bindings: {
    ENVIRONMENT: 'development' | 'production';
    TOKEN_SECRET: string;
    SUPER_KEY: string;
    RESEND_API_KEY: string;
  };
  Variables: {
    user: User;
  };
};
