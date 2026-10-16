import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads, analyticsEvents, applications, assessmentProgress, type InsertLead, type InsertAnalyticsEvent, type InsertApplication, type InsertAssessmentProgress } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---- Lead helpers ----

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(leads).values(data);
}

export async function getLeads(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(leads.status, filters.status as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(leads.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(leads.createdAt, filters.endDate));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(leads).where(where).orderBy(desc(leads.createdAt));
}

export async function updateLeadStatus(id: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;
  await db.update(leads).set(updateData).where(eq(leads.id, id));
}

export async function getLeadStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const total = await db.select({ count: count() }).from(leads);
  const byStatus = await db
    .select({ status: leads.status, count: count() })
    .from(leads)
    .groupBy(leads.status);

  // Leads per day for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const daily = await db
    .select({
      date: sql<string>`DATE(${leads.createdAt})`.as("date"),
      count: count(),
    })
    .from(leads)
    .where(gte(leads.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${leads.createdAt})`)
    .orderBy(sql`DATE(${leads.createdAt})`);

  return {
    total: total[0]?.count ?? 0,
    byStatus: byStatus.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>),
    daily,
  };
}

// ---- Application helpers ----

export async function createApplication(data: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(applications).values(data);
}

// ---- Assessment Progress helpers ----

export async function saveAssessmentProgress(data: InsertAssessmentProgress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Upsert by email - update existing or create new
  const existing = await db.select().from(assessmentProgress)
    .where(and(eq(assessmentProgress.email, data.email), eq(assessmentProgress.completed, false)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(assessmentProgress)
      .set({
        answers: data.answers,
        answeredCount: data.answeredCount,
        name: data.name,
        lastActivityAt: new Date(),
      })
      .where(eq(assessmentProgress.id, existing[0].id));
    return existing[0].resumeToken;
  } else {
    await db.insert(assessmentProgress).values(data);
    return data.resumeToken;
  }
}

export async function markAssessmentCompleted(email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(assessmentProgress)
    .set({ completed: true })
    .where(and(eq(assessmentProgress.email, email), eq(assessmentProgress.completed, false)));
}

export async function getAssessmentByResumeToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(assessmentProgress)
    .where(eq(assessmentProgress.resumeToken, token))
    .limit(1);
  return rows[0] || null;
}

export async function getStaleAssessments(olderThan: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assessmentProgress)
    .where(and(
      eq(assessmentProgress.completed, false),
      lte(assessmentProgress.lastActivityAt, olderThan),
      sql`${assessmentProgress.notifiedAt} IS NULL`
    ));
}

export async function getCompletedAssessmentByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(assessmentProgress)
    .where(and(eq(assessmentProgress.email, email), eq(assessmentProgress.completed, true)))
    .limit(1);
  return rows[0] || null;
}

export async function markAssessmentNotified(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(assessmentProgress)
    .set({ notifiedAt: new Date() })
    .where(eq(assessmentProgress.id, id));
}

// ---- Analytics helpers ----

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

  const eventsByType = await db
    .select({
      eventType: analyticsEvents.eventType,
      count: count(),
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.eventType);

  const dailyEvents = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.createdAt})`.as("date"),
      eventType: analyticsEvents.eventType,
      count: count(),
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(sql`DATE(${analyticsEvents.createdAt})`, analyticsEvents.eventType)
    .orderBy(sql`DATE(${analyticsEvents.createdAt})`);

  return { eventsByType, dailyEvents };
}
