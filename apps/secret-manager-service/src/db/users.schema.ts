import { sql } from 'drizzle-orm';
import { int } from 'drizzle-orm/sqlite-core';
import { text } from 'drizzle-orm/sqlite-core';
import { integer } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

export const Users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  // SHA-256 hash of the current one time password, never the code itself.
  otpCode: text('otp_code'),
  otpExpiration: int('otp_expiration'),
  otpAttempts: int('otp_attempts').notNull().default(0),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});
