import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Postgres schema (Neon on Vercel). Timestamps are stored with time zone.

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "applied",
  "converted",
  "archived",
]);

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: ts("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 200 }),
  source: varchar("source", { length: 100 }).default("direct"),
  message: text("message"),
  status: leadStatus("status").default("new").notNull(),
  notes: text("notes"),
  // Purchase details, set by the Stripe webhook.
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  stripePaymentIntent: varchar("stripe_payment_intent", { length: 255 }),
  product: varchar("product", { length: 100 }),
  amountCents: integer("amount_cents"),
  currency: varchar("currency", { length: 3 }),
  paidAt: ts("paid_at"),
  // CRM fields used by the dashboard.
  followUpAt: ts("follow_up_at"),
  lastContactedAt: ts("last_contacted_at"),
  tags: text("tags").array(),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, table => [
  index("leads_email_idx").on(table.email),
  index("leads_created_at_idx").on(table.createdAt),
]);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/** Timestamped notes on a lead, written from the dashboard. */
export const leadNotes = pgTable("lead_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
}, table => [index("lead_notes_lead_id_idx").on(table.leadId)]);

export type LeadNote = typeof leadNotes.$inferSelect;
export type InsertLeadNote = typeof leadNotes.$inferInsert;

/**
 * Every email the site sends through Resend: results, confirmations,
 * reminders and owner alerts. Lets the dashboard show what each person
 * received and how many emails go out each day.
 */
export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  toEmail: varchar("to_email", { length: 320 }).notNull(),
  kind: varchar("kind", { length: 60 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  providerId: varchar("provider_id", { length: 120 }),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  error: text("error"),
  createdAt: ts("created_at").defaultNow().notNull(),
}, table => [
  index("email_log_created_at_idx").on(table.createdAt),
  index("email_log_to_email_idx").on(table.toEmail),
]);

export type EmailLog = typeof emailLog.$inferSelect;
export type InsertEmailLog = typeof emailLog.$inferInsert;

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: text("event_data"),
  sessionId: varchar("session_id", { length: 100 }),
  userAgent: varchar("user_agent", { length: 500 }),
  referrer: varchar("referrer", { length: 500 }),
  createdAt: ts("created_at").defaultNow().notNull(),
}, table => [
  index("analytics_events_created_at_idx").on(table.createdAt),
  index("analytics_events_type_created_at_idx").on(table.eventType, table.createdAt),
]);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  q1_90day_goal: text("q1_90day_goal").notNull(),
  q2_obstacle: text("q2_obstacle").notNull(),
  q3_investment: varchar("q3_investment", { length: 50 }).notNull(),
  q4_anything_else: text("q4_anything_else"),
  assessmentData: text("assessment_data"),
  utmSource: varchar("utm_source", { length: 200 }),
  utmMedium: varchar("utm_medium", { length: 200 }),
  utmCampaign: varchar("utm_campaign", { length: 200 }),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const assessmentProgress = pgTable("assessment_progress", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 200 }),
  answers: text("answers"), // JSON stringified partial answers
  resumeToken: varchar("resume_token", { length: 64 }).notNull().unique(),
  totalQuestions: integer("total_questions").default(0),
  answeredCount: integer("answered_count").default(0),
  completed: boolean("completed").default(false).notNull(),
  notifiedAt: ts("notified_at"),
  reminderSentAt: ts("reminder_sent_at"),
  utmSource: varchar("utm_source", { length: 200 }),
  utmMedium: varchar("utm_medium", { length: 200 }),
  utmCampaign: varchar("utm_campaign", { length: 200 }),
  lastActivityAt: ts("last_activity_at").defaultNow().notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export type AssessmentProgress = typeof assessmentProgress.$inferSelect;
export type InsertAssessmentProgress = typeof assessmentProgress.$inferInsert;

/** A completed assessment with its saved report, reachable at /report/<token>. */
export const assessmentReports = pgTable("assessment_reports", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 200 }),
  answers: jsonb("answers").$type<Record<string, unknown>>().notNull(),
  scores: jsonb("scores").$type<Record<string, unknown>>().notNull(),
  analysis: text("analysis").notNull(),
  pdfKey: varchar("pdf_key", { length: 255 }),
  utmSource: varchar("utm_source", { length: 200 }),
  utmMedium: varchar("utm_medium", { length: 200 }),
  utmCampaign: varchar("utm_campaign", { length: 200 }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export type AssessmentReport = typeof assessmentReports.$inferSelect;
export type InsertAssessmentReport = typeof assessmentReports.$inferInsert;

/** Small key value store for things set from the dashboard, such as the Gmail connection. */
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

/**
 * One email or call between Marin and a contact, read from Gmail (origin
 * gmail), logged by hand in the dashboard (manual) or loaded once from the
 * earlier Gmail read (import). Forms, applications, purchases and the
 * site's own emails are not stored here; they come from their own tables.
 */
export const conversationEvents = pgTable("conversation_events", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull(), // sent | reply | purchase | auto
  channel: varchar("channel", { length: 20 }).notNull().default("email"), // email | call | message
  at: ts("at").notNull(),
  subject: varchar("subject", { length: 300 }),
  snippet: text("snippet"),
  origin: varchar("origin", { length: 20 }).notNull(), // gmail | manual | import
  externalId: varchar("external_id", { length: 120 }),
  threadId: varchar("thread_id", { length: 120 }),
  createdAt: ts("created_at").defaultNow().notNull(),
}, table => [
  index("conversation_events_email_idx").on(table.email),
  index("conversation_events_at_idx").on(table.at),
  uniqueIndex("conversation_events_external_idx").on(table.origin, table.externalId),
]);

export type ConversationEvent = typeof conversationEvents.$inferSelect;

/** Where each contact stands and the reply drafted for Marin, refreshed by the daily job. */
export const contactFollowups = pgTable("contact_followups", {
  email: varchar("email", { length: 320 }).primaryKey(),
  stage: varchar("stage", { length: 30 }).notNull(),
  priority: varchar("priority", { length: 10 }).notNull(),
  nextAction: text("next_action"),
  draftSubject: varchar("draft_subject", { length: 300 }),
  draftBody: text("draft_body"),
  basis: varchar("basis", { length: 64 }),
  draftedAt: ts("drafted_at"),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export type ContactFollowup = typeof contactFollowups.$inferSelect;
