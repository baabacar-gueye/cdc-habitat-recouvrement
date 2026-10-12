CREATE TABLE `collection_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`sale_id` text,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`due_date` text NOT NULL,
	`priority` text NOT NULL,
	`responsible` text NOT NULL,
	`status` text NOT NULL,
	`comment` text NOT NULL,
	`result` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`actor` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_collection_actions_client` ON `collection_actions` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_actions_status_due` ON `collection_actions` (`status`,`due_date`);--> statement-breakpoint
CREATE TABLE `promises` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`sale_id` text NOT NULL,
	`amount` integer NOT NULL,
	`due_date` text NOT NULL,
	`status` text NOT NULL,
	`comment` text NOT NULL,
	`result` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`actor` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_promises_client` ON `promises` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_promises_status_due` ON `promises` (`status`,`due_date`);