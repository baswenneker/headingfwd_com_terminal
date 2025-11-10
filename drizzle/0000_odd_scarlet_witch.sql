CREATE TABLE IF NOT EXISTS `headingfwd_com_terminal_chat_message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` text(256) NOT NULL,
	`role` text(32) NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_message_idx` ON `headingfwd_com_terminal_chat_message` (`sessionId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `headingfwd_com_terminal_chat_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` text(256) NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`messageCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastActivityAt` integer DEFAULT (unixepoch()) NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `headingfwd_com_terminal_chat_session_sessionId_unique` ON `headingfwd_com_terminal_chat_session` (`sessionId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_id_idx` ON `headingfwd_com_terminal_chat_session` (`sessionId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `expires_at_idx` ON `headingfwd_com_terminal_chat_session` (`expiresAt`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `headingfwd_com_terminal_post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `name_idx` ON `headingfwd_com_terminal_post` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `headingfwd_com_terminal_rate_limit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`identifier` text(256) NOT NULL,
	`action` text(64) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `identifier_action_idx` ON `headingfwd_com_terminal_rate_limit_log` (`identifier`,`action`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `created_at_idx` ON `headingfwd_com_terminal_rate_limit_log` (`createdAt`);