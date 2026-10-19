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
import { runDiagnostics } from "./diagnostics";
import { notifyOwner } from "./_core/notification";
import { submitChangedUrls } from "./indexNow";
import { describePurge, purgeTestData } from "./testData";

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
  // The smoke test calls this when it finishes. It only ever removes rows for
  // "+smoke" addresses, so it needs no secret.
  app.post("/api/test/cleanup", async (_req: Request, res: Response) => {
    try {
      const purged = await purgeTestData();
      console.log(`[Jobs] Test data: ${describePurge(purged)}`);
      res.json({ ok: true, ...purged, summary: describePurge(purged) });
    } catch (error) {
      console.error("[Jobs] Test data purge failed:", error);
      res.status(500).json({ ok: false, error: String((error as Error)?.message ?? error) });
    }
  });

  app.get("/api/cron/daily", async (req: Request, res: Response) => {
    if (!authorised(req)) {
      res.status(401).json({ error: "Unauthorised" });
      return;
    }
    try {
      const reminders = await runAbandonedAssessmentReminders();
      // Daily service check. Emails Marin only when something that is set up
      // has stopped working, so a quiet day means all is well.
      let diagnostics = await runDiagnostics();
      if (!diagnostics.ok) {
        // Give a passing blip 20 seconds and look again before emailing.
        await new Promise(r => setTimeout(r, 20_000));
        diagnostics = await runDiagnostics();
      }
      console.log(
        `[Jobs] Diagnostics: ${diagnostics.ok ? "all ok" : "failed: " + diagnostics.failed.join(", ")}` +
          (diagnostics.skipped.length ? `; not set up: ${diagnostics.skipped.join(", ")}` : "")
      );
      if (!diagnostics.ok) {
        const lines = diagnostics.failed.map(k => `${k}: ${diagnostics.checks[k].detail}`);
        await notifyOwner({
          title: `marinlazic.com check failed: ${diagnostics.failed.join(", ")}`,
          content: `The daily site check found a problem.\n\n${lines.join("\n")}\n\nChecked at ${diagnostics.ranAt}.`,
        }).catch(e => console.warn("[Jobs] Could not email the diagnostics result:", e));
      }
      // Tell Bing and friends which pages changed. Never fails the job.
      const indexNow = await submitChangedUrls().catch(e => {
        console.warn("[Jobs] IndexNow failed:", e);
        return { submitted: [], status: null, detail: String(e) };
      });
      console.log(`[Jobs] IndexNow: ${indexNow.detail}`);
      // Anything the smoke test left behind (it cleans up after itself, but a
      // run that died halfway would not have).
      const purged = await purgeTestData().catch(e => {
        console.warn("[Jobs] Test data purge failed:", e);
        return null;
      });
      if (purged) console.log(`[Jobs] Test data: ${describePurge(purged)}`);
      res.json({ ok: true, reminders, diagnostics, indexNow, purged, ranAt: new Date().toISOString() });
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
