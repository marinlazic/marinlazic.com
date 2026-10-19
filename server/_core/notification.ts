import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { ENV } from "./env";
import { recordEmail, type EmailKind } from "../emailLog";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;
const DEFAULT_OWNER = "marin@marinlazic.coach";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  }
  const title = input.title.trim();
  const content = input.content.trim();
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.` });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.` });
  }
  return { title, content };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Sends a short plain email to the site owner through Resend.
 * Returns true when Resend accepted it, false when it could not be sent.
 * Validation errors bubble up as TRPC errors.
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.resendApiKey) {
    console.warn("[Notification] RESEND_API_KEY not configured; owner not notified:", title);
    return false;
  }

  const to = ENV.ownerEmail || DEFAULT_OWNER;
  const from = ENV.resendFromEmail || "Marin Lazic <results@marinlazic.com>";

  try {
    const resend = new Resend(ENV.resendApiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: title,
      text: content,
      html: `<pre style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#121212">${escapeHtml(content)}</pre>`,
    });
    const kind: EmailKind = /new lead/i.test(title) ? "owner_lead" : "owner_alert";
    await recordEmail({ to, kind, subject: title, providerId: data?.id, ok: !error, error: error?.message });
    if (error) {
      console.warn("[Notification] Resend rejected owner email:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error sending owner email:", error);
    return false;
  }
}
