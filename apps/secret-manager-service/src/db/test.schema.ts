import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const secrets = sqliteTable('secrets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
