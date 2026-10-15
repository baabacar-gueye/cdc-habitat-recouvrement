CREATE TABLE "app_users" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	"password_hash" text,
	"password_set_at" text
);
--> statement-breakpoint
CREATE TABLE "audit" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text,
	"action" text NOT NULL,
	"before" text,
	"after" text,
	"created_at" text NOT NULL,
	"actor" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"sale_id" text,
	"action_id" text,
	"channel" text DEFAULT 'Appel téléphonique' NOT NULL,
	"next_title" text DEFAULT '' NOT NULL,
	"next_responsible" text DEFAULT '' NOT NULL,
	"next_channel" text DEFAULT 'Appel téléphonique' NOT NULL,
	"client_response" text DEFAULT '' NOT NULL,
	"promise_id" text,
	"call_date" text NOT NULL,
	"outcome" text NOT NULL,
	"summary" text NOT NULL,
	"next_date" text,
	"payment_date" text,
	"promised_amount" integer,
	"agent" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"first" text NOT NULL,
	"last" text NOT NULL,
	"nin" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"sale_id" text,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"due_date" text NOT NULL,
	"priority" text NOT NULL,
	"responsible" text NOT NULL,
	"status" text NOT NULL,
	"comment" text NOT NULL,
	"result" text NOT NULL,
	"completed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"actor" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" text NOT NULL,
	"used_at" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
	"sent_at" text
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"email" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" text NOT NULL,
	"blocked_until" text
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text NOT NULL,
	"actor" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"amount" integer NOT NULL,
	"kind" text NOT NULL,
	"date" text NOT NULL,
	"mode" text NOT NULL,
	"reference" text NOT NULL,
	"created_at" text NOT NULL,
	"actor" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promises" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"sale_id" text NOT NULL,
	"amount" integer NOT NULL,
	"due_date" text NOT NULL,
	"status" text NOT NULL,
	"comment" text NOT NULL,
	"result" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"actor" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"sheet" text NOT NULL,
	"source_row" integer,
	"program" text NOT NULL,
	"zone" text NOT NULL,
	"lot" text NOT NULL,
	"position" text NOT NULL,
	"area" double precision,
	"price_m2" double precision,
	"price" integer,
	"baseline" integer,
	"baseline_fees" integer,
	"source_balance" integer,
	"date" text NOT NULL,
	"flags" text NOT NULL,
	"raw" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"target_email" text NOT NULL,
	"operation" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_action_id_collection_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."collection_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_promise_id_promises_id_fk" FOREIGN KEY ("promise_id") REFERENCES "public"."promises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_actions" ADD CONSTRAINT "collection_actions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_actions" ADD CONSTRAINT "collection_actions_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_email_app_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."app_users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promises" ADD CONSTRAINT "promises_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promises" ADD CONSTRAINT "promises_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_email_app_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."app_users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_call_logs_client_date" ON "call_logs" USING btree ("client_id","call_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_call_logs_action" ON "call_logs" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "idx_collection_actions_client" ON "collection_actions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_collection_actions_status_due" ON "collection_actions" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_payments_sale" ON "payments" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_promises_client" ON "promises" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_promises_status_due" ON "promises" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "idx_sales_client" ON "sales" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sales_program_lot" ON "sales" USING btree ("program","lot");--> statement-breakpoint
CREATE INDEX "sessions_email_idx" ON "sessions" USING btree ("email");