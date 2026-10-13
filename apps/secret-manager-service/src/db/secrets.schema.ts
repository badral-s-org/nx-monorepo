import { integer, text } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { Groups } from './groups.schema';
import { relations } from 'drizzle-orm';

export const Secrets = sqliteTable('secrets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id')
    .notNull()
    .references(() => Groups.id),
  key: text('key').notNull(),
  secret: text('secret').notNull(),
  iv: text('iv').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => new Date()),
});

export const secretsRelations = relations(Secrets, ({ one }) => ({
  group: one(Groups, {
    fields: [Secrets.groupId],
    references: [Groups.id],
  }),
}));

export type SecretType = typeof Secrets.$inferSelect;
