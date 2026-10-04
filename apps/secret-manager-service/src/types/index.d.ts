type Context = {
  env: Env;
};

type Env = {
  DB: D1Database;
};

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
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
  };
  Variables: {
    user: User;
  };
};
