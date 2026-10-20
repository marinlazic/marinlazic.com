// Records every email the site sends, so the dashboard can show who got
// what and when. Never throws: a logging failure must not stop an email.
import { getDb } from "./db";
import { emailLog } from "../drizzle/schema";

export type EmailKind =
  | "assessment_results"
  | "assessment_reminder"
  | "enquiry_confirmation"
  | "application_confirmation"
  | "purchase_confirmation"
  | "guide_delivery"
  | "owner_application"
  | "owner_assessment"
  | "owner_lead"
  | "owner_alert";

export const EMAIL_KIND_LABELS: Record<EmailKind, string> = {
  assessment_results: "Assessment results",
  assessment_reminder: "Finish your assessment reminder",
  enquiry_confirmation: "Enquiry confirmation",
  application_confirmation: "Application confirmation",
  purchase_confirmation: "Purchase confirmation",
  guide_delivery: "Recovery Guide sent",
  owner_application: "New application (to Marin)",
  owner_assessment: "New assessment (to Marin)",
  owner_lead: "New lead (to Marin)",
  owner_alert: "Site alert (to Marin)",
};

export async function recordEmail(entry: {
  to: string;
  kind: EmailKind;
  subject: string;
  providerId?: string | null;
  ok: boolean;
  error?: unknown;
}): Promise<void> {
  try {
    const d = await getDb();
    if (!d) return;
    await d.insert(emailLog).values({
      toEmail: entry.to.slice(0, 320),
      kind: entry.kind,
      subject: entry.subject.slice(0, 300),
      providerId: entry.providerId ?? null,
      status: entry.ok ? "sent" : "failed",
      error: entry.ok ? null : String(entry.error ?? "unknown").slice(0, 2000),
    });
  } catch (err) {
    console.warn("[EmailLog] Could not record email:", err);
  }
}
