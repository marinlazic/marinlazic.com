CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_email" varchar(320) NOT NULL,
	"kind" varchar(60) NOT NULL,
	"subject" varchar(300) NOT NULL,
	"provider_id" varchar(120),
	"status" varchar(20) DEFAULT 'sent' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "email_log_created_at_idx" ON "email_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_log_to_email_idx" ON "email_log" USING btree ("to_email");