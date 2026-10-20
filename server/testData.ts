// Removes everything the smoke test left behind: leads (notes go with them),
// applications, assessment progress, saved reports and their PDFs in Blob,
// the email log, and the Kit subscriber (untagged and unsubscribed, since
// Kit's API cannot delete). Only rows whose address matches the test pattern
// are touched, so this is safe to expose to the smoke test without a secret.
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { storageDelete } from "./storage";
import { kitForgetSubscriber } from "./kit";
import { TEST_EMAIL_SQL_LIKE, isTestEmail } from "../shared/testData";

export type PurgeResult = {
  emails: string[];
  leads: number;
  applications: number;
  progress: number;
  reports: number;
  pdfs: number;
  emailLog: number;
  kit: string[];
};

export async function purgeTestData(): Promise<PurgeResult> {
  const result: PurgeResult = { emails: [], leads: 0, applications: 0, progress: 0, reports: 0, pdfs: 0, emailLog: 0, kit: [] };
  const d = await getDb();
  if (!d) return result;
  const like = TEST_EMAIL_SQL_LIKE;
  const rows = (q: ReturnType<typeof sql>) => d.execute(q).then((r: any) => (r.rows ?? r) as Record<string, unknown>[]);

  // Addresses first, so Kit can be cleaned even after the rows are gone.
  const found = await rows(sql`
    SELECT DISTINCT lower(email) AS email FROM (
      SELECT email FROM leads WHERE lower(email) LIKE ${like}
      UNION ALL SELECT email FROM applications WHERE lower(email) LIKE ${like}
      UNION ALL SELECT email FROM assessment_progress WHERE lower(email) LIKE ${like}
      UNION ALL SELECT email FROM assessment_reports WHERE lower(email) LIKE ${like}
      UNION ALL SELECT to_email AS email FROM email_log WHERE lower(to_email) LIKE ${like}
    ) t`);
  result.emails = found.map(r => String(r.email));

  // Saved PDFs in Blob, then the report rows.
  const reports = await rows(sql`SELECT pdf_key FROM assessment_reports WHERE lower(email) LIKE ${like} AND pdf_key IS NOT NULL`);
  for (const r of reports) {
    try {
      await storageDelete(String(r.pdf_key));
      result.pdfs++;
    } catch (err) {
      console.warn("[TestData] Could not delete PDF", r.pdf_key, err);
    }
  }

  const count = async (q: ReturnType<typeof sql>) => Number((await rows(q))[0]?.c ?? 0);
  result.reports = await count(sql`WITH d AS (DELETE FROM assessment_reports WHERE lower(email) LIKE ${like} RETURNING 1) SELECT count(*) AS c FROM d`);
  result.progress = await count(sql`WITH d AS (DELETE FROM assessment_progress WHERE lower(email) LIKE ${like} RETURNING 1) SELECT count(*) AS c FROM d`);
  result.applications = await count(sql`WITH d AS (DELETE FROM applications WHERE lower(email) LIKE ${like} RETURNING 1) SELECT count(*) AS c FROM d`);
  result.leads = await count(sql`WITH d AS (DELETE FROM leads WHERE lower(email) LIKE ${like} RETURNING 1) SELECT count(*) AS c FROM d`);
  // Emails to the test address, plus any alert to Marin that names the test
  // person in its subject (older runs sent those before alerts were skipped).
  result.emailLog = await count(sql`WITH d AS (DELETE FROM email_log WHERE lower(to_email) LIKE ${like} OR (kind LIKE 'owner_%' AND subject ILIKE '%smoke test%') RETURNING 1) SELECT count(*) AS c FROM d`);

  for (const email of result.emails) {
    try {
      result.kit.push(`${email}: ${await kitForgetSubscriber(email)}`);
    } catch (err) {
      result.kit.push(`${email}: ${String((err as Error)?.message ?? err)}`);
    }
  }

  return result;
}

/**
 * Removes one person entirely: lead rows (notes go with them), applications,
 * assessment progress, saved reports and their PDFs, the email log,
 * conversation events and the follow up row. Used by the Delete contact
 * button in the dashboard. Test addresses are also taken out of Kit; a real
 * address is left in Kit, since unsubscribing someone is a separate decision.
 */
export async function removeContact(emailIn: string): Promise<PurgeResult> {
  const email = emailIn.toLowerCase().trim();
  const result: PurgeResult = { emails: [email], leads: 0, applications: 0, progress: 0, reports: 0, pdfs: 0, emailLog: 0, kit: [] };
  const d = await getDb();
  if (!d || !email) return result;
  const rows = (q: ReturnType<typeof sql>) => d.execute(q).then((r: any) => (r.rows ?? r) as Record<string, unknown>[]);
  const count = async (q: ReturnType<typeof sql>) => Number((await rows(q))[0]?.c ?? 0);

  const reports = await rows(sql`SELECT pdf_key FROM assessment_reports WHERE lower(email) = ${email} AND pdf_key IS NOT NULL`);
  for (const r of reports) {
    try {
      await storageDelete(String(r.pdf_key));
      result.pdfs++;
    } catch (err) {
      console.warn("[TestData] Could not delete PDF", r.pdf_key, err);
    }
  }
  result.reports = await count(sql`WITH d AS (DELETE FROM assessment_reports WHERE lower(email) = ${email} RETURNING 1) SELECT count(*) AS c FROM d`);
  result.progress = await count(sql`WITH d AS (DELETE FROM assessment_progress WHERE lower(email) = ${email} RETURNING 1) SELECT count(*) AS c FROM d`);
  result.applications = await count(sql`WITH d AS (DELETE FROM applications WHERE lower(email) = ${email} RETURNING 1) SELECT count(*) AS c FROM d`);
  result.leads = await count(sql`WITH d AS (DELETE FROM leads WHERE lower(email) = ${email} RETURNING 1) SELECT count(*) AS c FROM d`);
  result.emailLog = await count(sql`WITH d AS (DELETE FROM email_log WHERE lower(to_email) = ${email} RETURNING 1) SELECT count(*) AS c FROM d`);
  await rows(sql`DELETE FROM conversation_events WHERE lower(email) = ${email}`);
  await rows(sql`DELETE FROM contact_followups WHERE lower(email) = ${email}`);

  if (isTestEmail(email)) {
    try {
      result.kit.push(`${email}: ${await kitForgetSubscriber(email)}`);
    } catch (err) {
      result.kit.push(`${email}: ${String((err as Error)?.message ?? err)}`);
    }
  }
  return result;
}

export function describePurge(r: PurgeResult): string {
  const total = r.leads + r.applications + r.progress + r.reports + r.emailLog;
  if (!total && !r.kit.length) return "nothing to remove";
  return `${r.leads} leads, ${r.progress} assessments in progress, ${r.reports} reports, ${r.pdfs} PDFs, ${r.applications} applications, ${r.emailLog} email log rows` + (r.kit.length ? `; Kit: ${r.kit.join(", ")}` : "");
}
