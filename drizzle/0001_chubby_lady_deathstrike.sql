CREATE TABLE IF NOT EXISTS `headingfwd_com_terminal_email_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` text(256) NOT NULL,
	`senderEmail` text(256) NOT NULL,
	`senderName` text(256),
	`subject` text(500) NOT NULL,
	`bodyPreview` text(1000),
	`resendMessageId` text(256),
	`status` text(32) NOT NULL,
	`errorMessage` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_email_idx` ON `headingfwd_com_terminal_email_log` (`sessionId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sender_email_idx` ON `headingfwd_com_terminal_email_log` (`senderEmail`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `created_at_email_idx` ON `headingfwd_com_terminal_email_log` (`createdAt`);--> statement-breakpoint
DROP TABLE IF EXISTS `headingfwd_com_terminal_post`;