import { sql } from 'drizzle-orm';
import { int } from 'drizzle-orm/sqlite-core';
import { text } from 'drizzle-orm/sqlite-core';
import { integer } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

export const Users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  otpCode: text('otp_code'),
  otpExpiration: int('otp_expiration'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});
