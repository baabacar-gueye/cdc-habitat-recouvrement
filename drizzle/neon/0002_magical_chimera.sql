CREATE TABLE "password_recovery_limits" (
	"email" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_recovery_limits" ADD CONSTRAINT "password_recovery_limits_email_app_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."app_users"("email") ON DELETE no action ON UPDATE no action;