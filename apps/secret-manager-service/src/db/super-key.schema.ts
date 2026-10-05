import { text } from 'drizzle-orm/sqlite-core';
import { integer } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

export enum SuperKeyActions {
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export const SuperKeys = sqliteTable('super_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull(),
  accessActions: text('access_actions', {
    mode: 'json',
  })
    .$type<SuperKeyActions[]>()
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => new Date()),
});
