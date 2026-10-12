CREATE TABLE `call_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`sale_id` text,
	`action_id` text,
	`call_date` text NOT NULL,
	`outcome` text NOT NULL,
	`summary` text NOT NULL,
	`next_date` text,
	`payment_date` text,
	`promised_amount` integer,
	`agent` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`action_id`) REFERENCES `collection_actions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_call_logs_client_date` ON `call_logs` (`client_id`,`call_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_call_logs_action` ON `call_logs` (`action_id`);