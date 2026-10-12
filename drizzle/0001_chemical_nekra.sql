DROP INDEX `idx_sales_program_lot`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sales_program_lot` ON `sales` (`program`,`lot`);