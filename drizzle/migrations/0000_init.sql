CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'applied', 'converted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" text,
	"session_id" varchar(100),
	"user_agent" varchar(500),
	"referrer" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"q1_90day_goal" text NOT NULL,
	"q2_obstacle" text NOT NULL,
	"q3_investment" varchar(50) NOT NULL,
	"q4_anything_else" text,
	"assessment_data" text,
	"utm_source" varchar(200),
	"utm_medium" varchar(200),
	"utm_campaign" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(200),
	"answers" text,
	"resume_token" varchar(64) NOT NULL,
	"total_questions" integer DEFAULT 0,
	"answered_count" integer DEFAULT 0,
	"completed" boolean DEFAULT false NOT NULL,
	"notified_at" timestamp with time zone,
	"reminder_sent_at" timestamp with time zone,
	"utm_source" varchar(200),
	"utm_medium" varchar(200),
	"utm_campaign" varchar(200),
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_progress_resume_token_unique" UNIQUE("resume_token")
);
--> statement-breakpoint
CREATE TABLE "assessment_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(200),
	"answers" jsonb NOT NULL,
	"scores" jsonb NOT NULL,
	"analysis" text NOT NULL,
	"pdf_key" varchar(255),
	"utm_source" varchar(200),
	"utm_medium" varchar(200),
	"utm_campaign" varchar(200),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_reports_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(200),
	"source" varchar(100) DEFAULT 'direct',
	"message" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"stripe_session_id" varchar(255),
	"stripe_payment_intent" varchar(255),
	"product" varchar(100),
	"amount_cents" integer,
	"currency" varchar(3),
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
