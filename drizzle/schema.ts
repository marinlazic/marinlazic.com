import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
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
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: text("event_data"),
  sessionId: varchar("session_id", { length: 100 }),
  userAgent: varchar("user_agent", { length: 500 }),
  referrer: varchar("referrer", { length: 500 }),
  createdAt: ts("created_at").defaultNow().notNull(),
});

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
