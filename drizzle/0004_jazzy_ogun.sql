ALTER TABLE `call_logs` ADD `channel` text DEFAULT 'Appel téléphonique' NOT NULL;--> statement-breakpoint
ALTER TABLE `call_logs` ADD `client_response` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `call_logs` ADD `promise_id` text REFERENCES promises(id);