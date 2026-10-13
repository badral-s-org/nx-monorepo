PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_secrets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`key` text NOT NULL,
	`secret` text NOT NULL,
	`iv` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_secrets`("id", "group_id", "key", "secret", "iv", "created_at", "updated_at") SELECT "id", "group_id", "key", "secret", "iv", "created_at", "updated_at" FROM `secrets`;--> statement-breakpoint
DROP TABLE `secrets`;--> statement-breakpoint
ALTER TABLE `__new_secrets` RENAME TO `secrets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;