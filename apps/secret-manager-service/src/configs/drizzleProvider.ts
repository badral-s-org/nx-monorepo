import { drizzle } from 'drizzle-orm/d1';

import * as schema from '../db';
import type { Bindings } from '../types';

export const getDB = (env: Bindings) => {
  return drizzle(env.DB, { schema });
};
