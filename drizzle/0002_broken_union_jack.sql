CREATE TABLE `headingfwd_com_terminal_pending_email` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` text(256) NOT NULL,
	`senderEmail` text(256) NOT NULL,
	`messageHash` text(64) NOT NULL,
	`nonce` text(64) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pending_email_session_idx` ON `headingfwd_com_terminal_pending_email` (`sessionId`);--> statement-breakpoint
CREATE INDEX `pending_email_created_at_idx` ON `headingfwd_com_terminal_pending_email` (`createdAt`);