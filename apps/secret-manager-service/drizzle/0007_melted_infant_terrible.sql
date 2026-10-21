-- The initial migration that created `users` was removed from the history, so
-- create it here when missing (fresh databases). Existing databases keep theirs.
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`otp_code` text,
	`otp_expiration` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `users` ADD `otp_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `secrets_group_id_key_unique` ON `secrets` (`group_id`,`key`);
