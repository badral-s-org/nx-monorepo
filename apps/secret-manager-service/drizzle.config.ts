import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './apps/secret-manager-service/src/db/index.ts',
  out: './apps/secret-manager-service/drizzle',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    databaseId: 'ca466baa-a95e-4574-9629-822015d4d825',
  },
});
