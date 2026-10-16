// One off import of the CSV exports from the Manus database panel into
// Postgres. Usage: DATABASE_URL=... tsx scripts/import-manus-csv.ts <folder>
// Expects files named leads.csv, applications.csv, assessment_progress.csv
// (any that exist). Column names are matched case insensitively, ignoring
// underscores, so createdAt and created_at both work.
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { leads, applications, assessmentProgress } from "../drizzle/schema";

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
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
const date = (v?: string) => (v ? new Date(v) : undefined);
const bool = (v?: string) => v === "1" || v === "true" || v === "t" || v === "TRUE";
const int = (v?: string) => (v ? Number.parseInt(v, 10) : undefined);

const folder = process.argv[2];
if (!folder || !process.env.DATABASE_URL) {
  console.error("Usage: DATABASE_URL=... tsx scripts/import-manus-csv.ts <folder>");
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const db = drizzle(pool);

async function importLeads(file: string) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  let n = 0;
  for (const r of rows) {
    const email = pick(r, "email");
    if (!email) continue;
    const status = (pick(r, "status") ?? "new") as (typeof leads.$inferInsert)["status"];
    await db.insert(leads).values({
      email,
      name: pick(r, "name") ?? null,
      source: pick(r, "source") ?? "direct",
      message: pick(r, "message") ?? null,
      status: ["new", "contacted", "applied", "converted", "archived"].includes(status) ? status : "new",
      notes: pick(r, "notes") ?? null,
      createdAt: date(pick(r, "createdAt", "created_at")),
      updatedAt: date(pick(r, "updatedAt", "updated_at")),
    });
    n++;
  }
  console.log(`[import] leads: ${n}`);
}

async function importApplications(file: string) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  let n = 0;
  for (const r of rows) {
    const email = pick(r, "email");
    const name = pick(r, "name");
    if (!email || !name) continue;
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
      createdAt: date(pick(r, "createdAt")),
    });
    n++;
  }
  console.log(`[import] applications: ${n}`);
}

async function importProgress(file: string) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  let n = 0;
  for (const r of rows) {
    const email = pick(r, "email");
    const resumeToken = pick(r, "resumeToken");
    if (!email || !resumeToken) continue;
    await db
      .insert(assessmentProgress)
      .values({
        email,
        name: pick(r, "name") ?? null,
        answers: pick(r, "answers") ?? null,
        resumeToken,
        totalQuestions: int(pick(r, "totalQuestions")) ?? 0,
        answeredCount: int(pick(r, "answeredCount")) ?? 0,
        completed: bool(pick(r, "completed")),
        notifiedAt: date(pick(r, "notifiedAt")) ?? null,
        // Everyone imported counts as already reminded: no old leads get a surprise email.
        reminderSentAt: date(pick(r, "reminderSentAt")) ?? new Date(),
        utmSource: pick(r, "utmSource") ?? null,
        utmMedium: pick(r, "utmMedium") ?? null,
        utmCampaign: pick(r, "utmCampaign") ?? null,
        lastActivityAt: date(pick(r, "lastActivityAt")),
        createdAt: date(pick(r, "createdAt")),
      })
      .onConflictDoNothing();
    n++;
  }
  console.log(`[import] assessment_progress: ${n}`);
}

try {
  const f = (name: string) => path.join(folder, name);
  if (fs.existsSync(f("leads.csv"))) await importLeads(f("leads.csv"));
  if (fs.existsSync(f("applications.csv"))) await importApplications(f("applications.csv"));
  if (fs.existsSync(f("assessment_progress.csv"))) await importProgress(f("assessment_progress.csv"));
} finally {
  await pool.end();
}
