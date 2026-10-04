import { drizzle } from 'drizzle-orm/d1';

import * as schema from '../db';

export const getDB = (env: Bindings) => {
  return drizzle(env.DB, { schema });
};
