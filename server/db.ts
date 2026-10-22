import { and, count, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { HUMAN_EVENT } from "./botFilter";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  users,
  leads,
  analyticsEvents,
  applications,
  assessmentProgress,
  assessmentReports,
  type InsertUser,
  type InsertLead,
  type InsertAnalyticsEvent,
  type InsertApplication,
  type InsertAssessmentProgress,
  type InsertAssessmentReport,
  type Lead,
} from "../drizzle/schema";

let _db: NodePgDatabase | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Neon needs TLS. Strip sslmode from the URL and set ssl explicitly so
      // the pg driver does not print its sslmode warning on every request.
      const url = new URL(process.env.DATABASE_URL);
      const wantsSsl = url.searchParams.get("sslmode") !== "disable";
      url.searchParams.delete("sslmode");
      _pool = new Pool({
        connectionString: url.toString(),
        ssl: wantsSsl ? { rejectUnauthorized: true } : undefined,
        max: 3,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 8_000,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ---- Users ----

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    const value = user[field];
    if (value === undefined) continue;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ---- Leads ----

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.insert(leads).values(data).returning({ id: leads.id });
  return rows[0]?.id;
}

export async function getLeads(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [];
  if (filters?.status) conditions.push(eq(leads.status, filters.status as Lead["status"]));
  if (filters?.startDate) conditions.push(gte(leads.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(leads.createdAt, filters.endDate));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(leads).where(where).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getLatestLeadByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(leads)
    .where(sql`lower(${leads.email}) = lower(${email})`)
    .orderBy(desc(leads.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateLeadStatus(id: number, status: Lead["status"], notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;
  await db.update(leads).set(updateData).where(eq(leads.id, id));
}

/**
 * Marks a lead as converted with the Stripe details. Matches by lead id when
 * the checkout session carried one, otherwise by the most recent lead for the
 * email, otherwise creates a new lead.
 */
export async function markLeadConverted(data: {
  leadId?: number;
  email: string;
  name?: string | null;
  stripeSessionId: string;
  stripePaymentIntent?: string | null;
  product: string;
  amountCents: number;
  currency: string;
  paidAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const purchase = {
    status: "converted" as const,
    stripeSessionId: data.stripeSessionId,
    stripePaymentIntent: data.stripePaymentIntent ?? null,
    product: data.product,
    amountCents: data.amountCents,
    currency: data.currency,
    paidAt: data.paidAt,
  };
  let lead = data.leadId ? await getLeadById(data.leadId) : null;
  if (!lead) lead = await getLatestLeadByEmail(data.email);
  if (lead) {
    await db
      .update(leads)
      .set({ ...purchase, ...(data.name && !lead.name ? { name: data.name } : {}) })
      .where(eq(leads.id, lead.id));
    return lead.id;
  }
  return createLead({
    email: data.email,
    name: data.name ?? null,
    source: "stripe-purchase",
    message: `Purchased ${data.product}`,
    ...purchase,
  });
}

/** Creates or updates the lead for an applicant and sets status applied. */
export async function upsertApplicantLead(data: { email: string; name: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getLatestLeadByEmail(data.email);
  if (existing) {
    const set: Record<string, unknown> = {};
    if (existing.status !== "converted") set.status = "applied";
    if (!existing.name) set.name = data.name;
    if (Object.keys(set).length > 0) await db.update(leads).set(set).where(eq(leads.id, existing.id));
    return existing.id;
  }
  return createLead({
    email: data.email,
    name: data.name,
    source: "coaching-application",
    message: data.message,
    status: "applied",
  });
}

export async function getLeadStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const total = await db.select({ count: count() }).from(leads);
  const byStatus = await db
    .select({ status: leads.status, count: count() })
    .from(leads)
    .groupBy(leads.status);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const daily = await db
    .select({
      date: sql<string>`to_char(${leads.createdAt}, 'YYYY-MM-DD')`.as("date"),
      count: count(),
    })
    .from(leads)
    .where(gte(leads.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${leads.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${leads.createdAt}, 'YYYY-MM-DD')`);
  return {
    total: total[0]?.count ?? 0,
    byStatus: byStatus.reduce(
      (acc, row) => {
        acc[row.status] = row.count;
        return acc;
      },
      {} as Record<string, number>
    ),
    daily,
  };
}

// ---- Applications ----

export async function createApplication(data: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(applications).values(data);
}

export async function getApplications() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

// ---- Assessment progress ----

export async function saveAssessmentProgress(data: InsertAssessmentProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(assessmentProgress)
    .where(and(eq(assessmentProgress.email, data.email), eq(assessmentProgress.completed, false)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(assessmentProgress)
      .set({
        answers: data.answers,
        answeredCount: data.answeredCount,
        totalQuestions: data.totalQuestions,
        name: data.name,
        lastActivityAt: new Date(),
      })
      .where(eq(assessmentProgress.id, existing[0].id));
    return existing[0].resumeToken;
  }
  await db.insert(assessmentProgress).values(data);
  return data.resumeToken;
}

export async function markAssessmentCompleted(email: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(assessmentProgress)
    .set({ completed: true, lastActivityAt: new Date() })
    .where(and(eq(assessmentProgress.email, email), eq(assessmentProgress.completed, false)));
}

export async function getAssessmentByResumeToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(assessmentProgress)
    .where(eq(assessmentProgress.resumeToken, token))
    .limit(1);
  return rows[0] || null;
}

export async function getStaleAssessments(olderThan: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assessmentProgress)
    .where(
      and(
        eq(assessmentProgress.completed, false),
        lte(assessmentProgress.lastActivityAt, olderThan),
        isNull(assessmentProgress.notifiedAt)
      )
    );
}

/** Incomplete assessments with an email, inactive for a day, never reminded. */
export async function getAbandonedAssessments(olderThan: Date, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assessmentProgress)
    .where(
      and(
        eq(assessmentProgress.completed, false),
        lte(assessmentProgress.lastActivityAt, olderThan),
        isNull(assessmentProgress.reminderSentAt),
        sql`${assessmentProgress.email} <> ''`
      )
    )
    .orderBy(assessmentProgress.lastActivityAt)
    .limit(limit);
}

export async function markAssessmentReminded(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(assessmentProgress)
    .set({ reminderSentAt: new Date() })
    .where(eq(assessmentProgress.id, id));
}

export async function getCompletedAssessmentByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(assessmentProgress)
    .where(and(eq(assessmentProgress.email, email), eq(assessmentProgress.completed, true)))
    .orderBy(desc(assessmentProgress.lastActivityAt))
    .limit(1);
  return rows[0] || null;
}

export async function getAllAssessmentProgress() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(assessmentProgress).orderBy(desc(assessmentProgress.lastActivityAt));
}

export async function markAssessmentNotified(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(assessmentProgress)
    .set({ notifiedAt: new Date() })
    .where(eq(assessmentProgress.id, id));
}

// ---- Assessment reports ----

export async function createAssessmentReport(data: InsertAssessmentReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.insert(assessmentReports).values(data).returning({ id: assessmentReports.id });
  return rows[0]?.id;
}

export async function getAssessmentReportByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(assessmentReports)
    .where(eq(assessmentReports.token, token))
    .limit(1);
  const report = rows[0];
  if (!report) return null;
  if (report.expiresAt.getTime() < Date.now()) return null;
  return report;
}

export async function getLatestReportByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(assessmentReports)
    .where(sql`lower(${assessmentReports.email}) = lower(${email})`)
    .orderBy(desc(assessmentReports.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getReportTokensByEmails(emails: string[]) {
  const db = await getDb();
  if (!db || emails.length === 0) return new Map<string, string>();
  const rows = await db
    .select({ email: assessmentReports.email, token: assessmentReports.token, createdAt: assessmentReports.createdAt })
    .from(assessmentReports)
    .orderBy(desc(assessmentReports.createdAt));
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = row.email.toLowerCase();
    if (!map.has(key)) map.set(key, row.token);
  }
  return map;
}

// ---- Analytics ----

export async function trackEvent(data: InsertAnalyticsEvent) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analyticsEvents).values(data);
}

export async function getAnalyticsStats(days = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const since = new Date();
  since.setDate(since.getDate() - days);
  const dayExpr = sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`;
  const eventsByType = await db
    .select({ eventType: analyticsEvents.eventType, count: count() })
    .from(analyticsEvents)
    .where(and(gte(analyticsEvents.createdAt, since), HUMAN_EVENT))
    .groupBy(analyticsEvents.eventType);
  const dailyEvents = await db
    .select({
      date: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`.as("date"),
      eventType: analyticsEvents.eventType,
      count: count(),
    })
    .from(analyticsEvents)
    .where(and(gte(analyticsEvents.createdAt, since), HUMAN_EVENT))
    .groupBy(dayExpr, analyticsEvents.eventType)
    .orderBy(dayExpr);
  return { eventsByType, dailyEvents };
}
