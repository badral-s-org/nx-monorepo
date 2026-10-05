import { relations } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { Secrets } from './secrets.schema';

export const Groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const groupsRelations = relations(Groups, ({ many }) => ({
  secrets: many(Secrets),
}));
