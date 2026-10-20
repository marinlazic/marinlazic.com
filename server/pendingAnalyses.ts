// Reports saved while Gemini could not answer carry scores.analysisPending.
// The daily job comes back for them: writes the analysis, rebuilds the PDF,
// and emails the person their full report. Stops at once on a quota error.
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { assessmentReports } from "../drizzle/schema";
import { generatePerformanceAnalysis, reportUrlFor } from "./routers";
import { generateAssessmentPDF } from "./pdf";
import { storagePut, storageConfigured } from "./storage";
import { sendAssessmentResultsEmail } from "./email";
import { isTestEmail } from "../shared/testData";

export type RetryResult = { pending: number; written: number; failed: number; stopped: string | null };

export async function retryPendingAnalyses(limit = 10): Promise<RetryResult> {
  const d = await getDb();
  const out: RetryResult = { pending: 0, written: 0, failed: 0, stopped: null };
  if (!d) return out;
  const rows = (await d
    .select()
    .from(assessmentReports)
    .where(sql`${assessmentReports.scores}->>'analysisPending' = 'true' AND ${assessmentReports.expiresAt} > now()`)
    .orderBy(assessmentReports.createdAt)
    .limit(limit)) as (typeof assessmentReports.$inferSelect)[];
  out.pending = rows.length;

  for (const r of rows) {
    if (isTestEmail(r.email)) continue;
    const answers = r.answers as Record<string, unknown>;
    let analysis: string;
    try {
      analysis = await generatePerformanceAnalysis(answers);
    } catch (err) {
      const msg = String((err as Error)?.message ?? err);
      out.failed++;
      if (/quota/i.test(msg)) {
        out.stopped = "Gemini quota is used up";
        break;
      }
      continue;
    }
    let pdfBuffer: Buffer | undefined;
    let pdfKey = r.pdfKey;
    try {
      pdfBuffer = await generateAssessmentPDF({ name: r.name || "Your Results", analysis, answers });
      if (storageConfigured()) {
        const stored = await storagePut(`reports/${r.token}.pdf`, pdfBuffer, "application/pdf");
        pdfKey = stored.key;
      }
    } catch (err) {
      console.warn("[Assessment] PDF rebuild failed for a pending report:", err);
    }
    const scores = { ...(r.scores as Record<string, unknown>) };
    delete scores.analysisPending;
    await d.update(assessmentReports).set({ analysis, scores, pdfKey }).where(sql`${assessmentReports.id} = ${r.id}`);
    out.written++;
    try {
      await sendAssessmentResultsEmail({ email: r.email, name: r.name || "", analysis, answers, pdfBuffer, reportUrl: reportUrlFor(r.token) });
    } catch (err) {
      console.warn("[Assessment] Could not email the completed report:", err);
    }
  }
  return out;
}
