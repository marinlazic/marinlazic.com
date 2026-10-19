CREATE TABLE "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_followups" (
	"email" varchar(320) PRIMARY KEY NOT NULL,
	"stage" varchar(30) NOT NULL,
	"priority" varchar(10) NOT NULL,
	"next_action" text,
	"draft_subject" varchar(300),
	"draft_body" text,
	"basis" varchar(64),
	"drafted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"channel" varchar(20) DEFAULT 'email' NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"subject" varchar(300),
	"snippet" text,
	"origin" varchar(20) NOT NULL,
	"external_id" varchar(120),
	"thread_id" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "conversation_events_email_idx" ON "conversation_events" USING btree ("email");--> statement-breakpoint
CREATE INDEX "conversation_events_at_idx" ON "conversation_events" USING btree ("at");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_events_external_idx" ON "conversation_events" USING btree ("origin","external_id");