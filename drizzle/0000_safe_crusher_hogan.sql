CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text,
	`action` text NOT NULL,
	`before` text,
	`after` text,
	`created_at` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`first` text NOT NULL,
	`last` text NOT NULL,
	`nin` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`address` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`actor` text NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`amount` integer NOT NULL,
	`kind` text NOT NULL,
	`date` text NOT NULL,
	`mode` text NOT NULL,
	`reference` text NOT NULL,
	`created_at` text NOT NULL,
	`actor` text NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payments_sale` ON `payments` (`sale_id`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`sheet` text NOT NULL,
	`source_row` integer,
	`program` text NOT NULL,
	`zone` text NOT NULL,
	`lot` text NOT NULL,
	`position` text NOT NULL,
	`area` real,
	`price_m2` real,
	`price` integer,
	`baseline` integer,
	`baseline_fees` integer,
	`source_balance` integer,
	`date` text NOT NULL,
	`flags` text NOT NULL,
	`raw` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sales_client` ON `sales` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_sales_program_lot` ON `sales` (`program`,`lot`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
