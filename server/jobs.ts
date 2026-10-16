import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { ENV } from "./_core/env";
import {
  getAbandonedAssessments,
  getAssessmentReportByToken,
  markAssessmentReminded,
} from "./db";
import { sendAssessmentReminderEmail } from "./email";
import { kitOnAssessmentAbandoned } from "./kit";
import { storageGetBuffer } from "./storage";

function authorised(req: Request): boolean {
  if (!ENV.cronSecret) return false;
  const header = req.headers.authorization || "";
  const expected = `Bearer ${ENV.cronSecret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Daily job. Vercel Cron calls /api/cron/daily with the CRON_SECRET bearer
 * token. Sends one reminder to each person who started the assessment more
 * than 24 hours ago, gave an email, and never finished. Never more than one.
 */
export async function runAbandonedAssessmentReminders(): Promise<{
  checked: number;
  sent: number;
  skipped: number;
}> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await getAbandonedAssessments(cutoff, 100);
  let sent = 0;
  let skipped = 0;
  for (const row of rows) {
    const resumeUrl = `${ENV.siteOrigin}/assessment?resume=${encodeURIComponent(row.resumeToken)}`;
    try {
      const ok = await sendAssessmentReminderEmail({
        email: row.email,
        name: row.name,
        resumeUrl,
      });
      // Mark first, so a Kit failure can never cause a second email.
      await markAssessmentReminded(row.id);
      if (ok) {
        sent++;
        try {
          await kitOnAssessmentAbandoned(row.email, row.name ?? undefined);
        } catch (e) {
          console.warn("[Jobs] Kit abandoned tag failed:", e);
        }
      } else {
        skipped++;
      }
    } catch (e) {
      console.warn("[Jobs] Reminder failed for progress row", row.id, e);
      skipped++;
    }
  }
  return { checked: rows.length, sent, skipped };
}

export function registerJobRoutes(app: Express) {
  app.get("/api/cron/daily", async (req: Request, res: Response) => {
    if (!authorised(req)) {
      res.status(401).json({ error: "Unauthorised" });
      return;
    }
    try {
      const reminders = await runAbandonedAssessmentReminders();
      res.json({ ok: true, reminders, ranAt: new Date().toISOString() });
    } catch (error) {
      console.error("[Jobs] Daily job failed:", error);
      res.status(500).json({ ok: false });
    }
  });

  // PDF download for a saved report. The token is the only key.
  app.get("/api/report/:token/pdf", async (req: Request, res: Response) => {
    const token = String(req.params.token || "");
    if (!/^[A-Za-z0-9_-]{10,80}$/.test(token)) {
      res.status(404).end();
      return;
    }
    const report = await getAssessmentReportByToken(token);
    if (!report || !report.pdfKey) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    try {
      const buffer = await storageGetBuffer(report.pdfKey);
      if (!buffer) {
        res.status(404).json({ error: "PDF not available" });
        return;
      }
      res
        .status(200)
        .setHeader("Content-Type", "application/pdf")
        .setHeader("Content-Disposition", 'attachment; filename="ML-Performance-Assessment.pdf"')
        .setHeader("Cache-Control", "private, no-store")
        .end(buffer);
    } catch (error) {
      console.error("[Report] PDF fetch failed:", error);
      res.status(500).json({ error: "PDF fetch failed" });
    }
  });
}
