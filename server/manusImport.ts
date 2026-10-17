// One off import of the CSV exports from the Manus database panel. Used by
// scripts/import-manus-csv.ts (local, with DATABASE_URL) and by the protected
// endpoint POST /api/admin/import-manus (CRON_SECRET bearer), which takes the
// CSV text in a JSON body so the files never need to be committed anywhere.
// Safe to run twice: a row that already exists (same email and created time,
// or same resume token) is skipped.
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { applications, assessmentProgress, leads } from "../drizzle/schema";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some(v => v !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some(v => v !== "")) rows.push(row);
  }
  const header = rows.shift() ?? [];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return rows.map(r => Object.fromEntries(header.map((h, i) => [norm(h), r[i] ?? ""])));
}

const pick = (r: Record<string, string>, ...names: string[]) => {
  for (const n of names) {
    const v = r[n.toLowerCase().replace(/[^a-z0-9]/g, "")];
    if (v !== undefined && v !== "" && v !== "null" && v !== "NULL") return v;
  }
  return undefined;
};
// Manus exported times as "YYYY-MM-DD HH:MM:SS" in UTC with no zone marker.
const date = (v?: string) => {
  if (!v) return undefined;
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v) ? v.replace(" ", "T") + "Z" : v;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const bool = (v?: string) => v === "1" || v === "true" || v === "t" || v === "TRUE";
const int = (v?: string) => (v ? Number.parseInt(v, 10) : undefined);

export type ImportCount = { inserted: number; skipped: number; rows: number };

export async function importLeadsCsv(db: NodePgDatabase, text: string): Promise<ImportCount> {
  const rows = parseCsv(text);
  const out: ImportCount = { inserted: 0, skipped: 0, rows: rows.length };
  for (const r of rows) {
    const email = pick(r, "email");
    if (!email) {
      out.skipped++;
      continue;
    }
    const createdAt = date(pick(r, "createdAt", "created_at"));
    if (createdAt) {
      const existing = await db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.email, email), eq(leads.createdAt, createdAt)))
        .limit(1);
      if (existing.length) {
        out.skipped++;
        continue;
      }
    }
    const rawStatus = pick(r, "status") ?? "new";
    const status = (["new", "contacted", "applied", "converted", "archived"].includes(rawStatus)
      ? rawStatus
      : "new") as (typeof leads.$inferInsert)["status"];
    await db.insert(leads).values({
      email,
      name: pick(r, "name") ?? null,
      source: pick(r, "source") ?? "direct",
      message: pick(r, "message") ?? null,
      status,
      notes: pick(r, "notes") ?? null,
      createdAt,
      updatedAt: date(pick(r, "updatedAt", "updated_at")) ?? createdAt,
    });
    out.inserted++;
  }
  return out;
}

export async function importApplicationsCsv(db: NodePgDatabase, text: string): Promise<ImportCount> {
  const rows = parseCsv(text);
  const out: ImportCount = { inserted: 0, skipped: 0, rows: rows.length };
  for (const r of rows) {
    const email = pick(r, "email");
    const name = pick(r, "name");
    if (!email || !name) {
      out.skipped++;
      continue;
    }
    const createdAt = date(pick(r, "createdAt", "created_at"));
    if (createdAt) {
      const existing = await db
        .select({ id: applications.id })
        .from(applications)
        .where(and(eq(applications.email, email), eq(applications.createdAt, createdAt)))
        .limit(1);
      if (existing.length) {
        out.skipped++;
        continue;
      }
    }
    await db.insert(applications).values({
      name,
      email,
      q1_90day_goal: pick(r, "q1_90day_goal", "q190daygoal") ?? "",
      q2_obstacle: pick(r, "q2_obstacle") ?? "",
      q3_investment: pick(r, "q3_investment") ?? "",
      q4_anything_else: pick(r, "q4_anything_else") ?? null,
      assessmentData: pick(r, "assessmentData") ?? null,
      utmSource: pick(r, "utmSource") ?? null,
      utmMedium: pick(r, "utmMedium") ?? null,
      utmCampaign: pick(r, "utmCampaign") ?? null,
      createdAt,
    });
    out.inserted++;
  }
  return out;
}

export async function importProgressCsv(db: NodePgDatabase, text: string): Promise<ImportCount> {
  const rows = parseCsv(text);
  const out: ImportCount = { inserted: 0, skipped: 0, rows: rows.length };
  for (const r of rows) {
    const email = pick(r, "email");
    const resumeToken = pick(r, "resumeToken", "resume_token");
    if (!email || !resumeToken) {
      out.skipped++;
      continue;
    }
    const result = await db
      .insert(assessmentProgress)
      .values({
        email,
        name: pick(r, "name") ?? null,
        answers: pick(r, "answers") ?? null,
        resumeToken,
        totalQuestions: int(pick(r, "totalQuestions", "total_questions")) ?? 0,
        answeredCount: int(pick(r, "answeredCount", "answered_count")) ?? 0,
        completed: bool(pick(r, "completed")),
        notifiedAt: date(pick(r, "notifiedAt", "notified_at")) ?? null,
        // Everyone imported counts as already reminded: no old leads get a surprise email.
        reminderSentAt: date(pick(r, "reminderSentAt", "reminder_sent_at")) ?? new Date(),
        utmSource: pick(r, "utmSource", "utm_source") ?? null,
        utmMedium: pick(r, "utmMedium", "utm_medium") ?? null,
        utmCampaign: pick(r, "utmCampaign", "utm_campaign") ?? null,
        lastActivityAt: date(pick(r, "lastActivityAt", "last_activity_at")),
        createdAt: date(pick(r, "createdAt", "created_at")),
      })
      .onConflictDoNothing()
      .returning({ id: assessmentProgress.id });
    if (result.length) out.inserted++;
    else out.skipped++;
  }
  return out;
}

export type ManusImportInput = {
  leads?: string;
  applications?: string;
  assessmentProgress?: string;
};

export async function importManus(db: NodePgDatabase, input: ManusImportInput) {
  const result: Record<string, ImportCount> = {};
  if (input.leads) result.leads = await importLeadsCsv(db, input.leads);
  if (input.applications) result.applications = await importApplicationsCsv(db, input.applications);
  if (input.assessmentProgress) result.assessmentProgress = await importProgressCsv(db, input.assessmentProgress);
  return result;
}

function authorised(req: Request): boolean {
  if (!ENV.cronSecret) return false;
  const header = req.headers.authorization || "";
  const expected = `Bearer ${ENV.cronSecret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const cors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Max-Age", "600");
};

export function registerManusImportRoute(app: Express) {
  app.options("/api/admin/import-manus", (_req, res) => {
    cors(res);
    res.status(204).end();
  });
  app.post("/api/admin/import-manus", async (req: Request, res: Response) => {
    cors(res);
    if (!authorised(req)) {
      res.status(401).json({ error: "Unauthorised" });
      return;
    }
    const body = (req.body ?? {}) as ManusImportInput;
    const input: ManusImportInput = {};
    for (const key of ["leads", "applications", "assessmentProgress"] as const) {
      if (typeof body[key] === "string" && body[key]!.length) input[key] = body[key];
    }
    if (!Object.keys(input).length) {
      res.status(400).json({ error: "Send leads, applications or assessmentProgress as CSV text" });
      return;
    }
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database not available" });
      return;
    }
    try {
      const result = await importManus(db, input);
      console.log("[Import] Manus import:", JSON.stringify(result));
      res.status(200).json({ ok: true, result });
    } catch (error) {
      console.error("[Import] Manus import failed:", error);
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message.slice(0, 300) : "failed" });
    }
  });
}
