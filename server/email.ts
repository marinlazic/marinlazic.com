import { Resend } from "resend";
import { ENV } from "./_core/env";
import { generateAssessmentPDF } from "./pdf";
import { recordEmail, type EmailKind } from "./emailLog";
import { isTestEmail } from "../shared/testData";
import { RECOVERY_GUIDE } from "../shared/recoveryGuide";

let resendClient: Resend | null = null;


// Every send goes through here so the dashboard can list what was sent.
async function sendLogged(resend: Resend, kind: EmailKind, payload: Parameters<Resend["emails"]["send"]>[0]) {
  const to = Array.isArray(payload.to) ? payload.to[0] : payload.to;
  const subject = payload.subject ?? "";
  try {
    const result = await resend.emails.send(payload);
    await recordEmail({ to, kind, subject, providerId: result.data?.id, ok: !result.error, error: result.error?.message });
    return result;
  } catch (err) {
    await recordEmail({ to, kind, subject, ok: false, error: err });
    throw err;
  }
}

function getResendClient(): Resend {
  if (!resendClient) {
    if (!ENV.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(ENV.resendApiKey);
  }
  return resendClient;
}

// ─── Site look ──────────────────────────────────────────
// Every email uses the same colours and type as marinlazic.com
// (client/src/index.css) and the PDF report (server/pdf.ts): ivory paper, ink
// type, oat cards, hairlines, an ink button. Email clients that cannot load
// DM Sans or Inter fall back to Helvetica or Arial.
const PAPER = "#FAF9F5";
const INK = "#141413";
const BODY = "#3D3D3A";
const MUTE = "#5E5D59";
const OAT = "#F0EEE6";
const LINE = "#DDDBD0";
const HEAD_FONT = "'DM Sans','Inter',Helvetica,Arial,sans-serif";
const BODY_FONT = "'Inter',Helvetica,Arial,sans-serif";
const P_STYLE = `color:${BODY}; font-size:16px; line-height:1.6; margin:0 0 16px 0; font-family:${BODY_FONT};`;

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The site's main button: ink, rounded, sentence case, an arrow. */
function emailButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block; background-color:${INK}; color:${PAPER}; font-size:15px; font-weight:500; line-height:1; text-decoration:none; padding:15px 24px; border-radius:8px; font-family:${BODY_FONT};">${label} &rarr;</a>`;
}

/** An oat card, the same block the site uses for an offer or a note. */
function emailCard(inner: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${OAT}; border-radius:12px;"><tr><td style="padding:26px 26px 28px 26px;">${inner}</td></tr></table>`;
}

/** A small label over a block of text, for the notes Marin receives. */
function emailNote(label: string, text: string): string {
  return `<div style="margin:16px 0 0 0;">${emailCard(
    `<p style="color:${MUTE}; font-size:13px; font-weight:500; margin:0 0 6px 0; font-family:${BODY_FONT};">${label}</p><p style="color:${INK}; font-size:15px; line-height:1.6; margin:0; font-family:${BODY_FONT};">${text}</p>`,
  )}</div>`;
}

/** Label and value rows with hairlines, like the detail rows on the site. */
function emailRows(rows: Array<[string, string] | null | false | "">): string {
  const cells = rows
    .filter((r): r is [string, string] => Array.isArray(r))
    .map(
      ([k, v]) =>
        `<tr><td style="padding:11px 16px 11px 0; border-top:1px solid ${LINE}; color:${MUTE}; font-size:13px; width:140px; vertical-align:top; font-family:${BODY_FONT};">${k}</td><td style="padding:11px 0; border-top:1px solid ${LINE}; color:${INK}; font-size:15px; font-family:${BODY_FONT};">${v}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse; border-bottom:1px solid ${LINE};">${cells}</table>`;
}

/**
 * The frame every email shares: the Marin Lazic wordmark with a short label,
 * a hairline, the content, then a quiet footer.
 */
function emailShell(opts: { title: string; label?: string; content: string; footer?: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${opts.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:${PAPER}; font-family:${BODY_FONT};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:28px 16px 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:100%; max-width:600px; background-color:${PAPER};">
          <tr>
            <td style="padding:0 8px 16px 8px; border-bottom:1px solid ${LINE};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
                <td style="font-family:${HEAD_FONT}; font-size:19px; font-weight:700; color:${INK}; letter-spacing:-0.2px;">Marin Lazic</td>
                <td align="right" style="font-family:${BODY_FONT}; font-size:13px; font-weight:500; color:${MUTE};">${opts.label ?? ""}</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 8px 0 8px;">
              ${opts.content}
            </td>
          </tr>
          <tr>
            <td style="padding:36px 8px 0 8px;">
              <p style="border-top:1px solid ${LINE}; padding-top:16px; color:${MUTE}; font-size:13px; line-height:1.5; margin:0; font-family:${BODY_FONT};">${opts.footer ?? "Marin Lazic | Health &amp; Performance Coach"} | <a href="https://www.marinlazic.com" style="color:${MUTE}; text-decoration:underline;">marinlazic.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const greeting = (firstName: string) =>
  `<p style="color:${INK}; font-size:26px; font-weight:700; line-height:1.15; letter-spacing:-0.4px; margin:0 0 18px 0; font-family:${HEAD_FONT};">Hi ${esc(firstName)},</p>`;

// ─── Markdown to HTML Converter ─────────────────────────
function markdownToHtml(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, `<h3 style="color:${INK}; font-size:19px; font-weight:700; line-height:1.25; letter-spacing:-0.2px; margin:28px 0 10px 0; font-family:${HEAD_FONT};">$1</h3>`);
  html = html.replace(/^## (.+)$/gm, `<h2 style="color:${INK}; font-size:24px; font-weight:700; line-height:1.2; letter-spacing:-0.4px; margin:32px 0 14px 0; font-family:${HEAD_FONT};">$1</h2>`);

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${INK};">$1</strong>`);

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, `<blockquote style="background-color:${OAT}; border-radius:8px; padding:14px 18px; margin:16px 0; color:${INK}; font-size:16px; line-height:1.55; font-family:${BODY_FONT};">$1</blockquote>`);

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, `<li style="margin:6px 0; color:${BODY}; font-size:16px; line-height:1.55; font-family:${BODY_FONT};">$1</li>`);
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul style="padding-left:20px; margin:12px 0;">${match}</ul>`);

  // Paragraphs (lines that are not already wrapped in HTML tags)
  html = html.replace(/^(?!<[hublq])((?!<).+)$/gm, `<p style="color:${BODY}; font-size:16px; line-height:1.6; margin:10px 0; font-family:${BODY_FONT};">$1</p>`);

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

  return html;
}

// ─── Build Assessment Results Email HTML ────────────────
function buildAssessmentEmailHtml(name: string, email: string, analysis: string, hasPdf: boolean = false, reportUrl?: string): string {
  const analysisHtml = markdownToHtml(analysis);
  const firstName = name.split(" ")[0] || "there";
  const pdfLine = hasPdf
    ? "Your full report is also attached as a PDF for easy reference."
    : "Your full report is below.";
  const reportLinkBlock = reportUrl
    ? `<p style="${P_STYLE}"><a href="${reportUrl}" style="color:${INK}; font-weight:600; text-decoration:underline;">View your report online</a>. The link works for 90 days and includes the PDF download.</p>`
    : "";
  const applyHref = `https://www.marinlazic.com/apply?email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName)}&utm_source=assessment&utm_medium=email&utm_campaign=results`;

  return emailShell({
    title: "Your ML Performance Assessment Results",
    label: "Performance Assessment Results",
    content: `${greeting(firstName)}
              <p style="${P_STYLE}">Here is your personalised performance analysis based on your recent assessment. This is the same framework I use with Olympic athletes and high-performing executives. ${pdfLine}</p>
              <p style="${P_STYLE}">Read it carefully. There are specific protocols in here you can start implementing today.</p>
              ${reportLinkBlock}
              <div style="border-top:1px solid ${LINE}; margin:26px 0 0 0; padding-top:4px;">
              ${analysisHtml}
              </div>
              <div style="margin:32px 0 0 0;">${emailCard(`
                <p style="color:${INK}; font-size:22px; font-weight:700; line-height:1.2; letter-spacing:-0.3px; margin:0 0 10px 0; font-family:${HEAD_FONT};">Ready to go further?</p>
                <p style="${P_STYLE} margin:0 0 20px 0;">If you want a personalised program built around these results, the same system I use with Olympic athletes, apply below. I work with a limited number of clients and every program is built from your data, your goals, and your life.</p>
                ${emailButton("Apply for coaching", applyHref)}
                <p style="color:${MUTE}; font-size:13px; line-height:1.5; margin:14px 0 0 0; font-family:${BODY_FONT};">Short application. I reply personally within 24 hours.</p>`)}</div>`,
  });
}

// ─── Send Assessment Results Email ──────────────────────
export async function sendAssessmentResultsEmail(params: {
  email: string;
  name: string;
  analysis: string;
  answers?: Record<string, unknown>;
  /** Already generated PDF. When absent one is generated from the answers. */
  pdfBuffer?: Buffer;
  /** Link to the saved report page, shown near the top of the email. */
  reportUrl?: string;
}): Promise<boolean> {
  const { email, name, analysis, answers, reportUrl } = params;

  if (!email) {
    console.warn("[Email] No email address provided, skipping email send");
    return false;
  }

  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email send");
    return false;
  }

  try {
    const resend = getResendClient();
    // Generate PDF first so we know whether to say "attached" or "below"
    let hasPdf = false;

    // Always send from results@marinlazic.com
    const senderEmail = "Marin Lazic <results@marinlazic.com>";

    // Generate PDF attachment if answers are provided
    let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;

    if (params.pdfBuffer || (answers && Object.keys(answers).length > 0)) {
      try {
        const pdfBuffer =
          params.pdfBuffer ??
          (await generateAssessmentPDF({
            name: name || "Your Results",
            analysis,
            answers: answers ?? {},
          }));

        attachments = [
          {
            filename: "ML-Performance-Assessment.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ];

        hasPdf = true;
        console.log("[Email] PDF generated successfully, size:", pdfBuffer.length, "bytes");
      } catch (pdfErr) {
        console.error("[Email] PDF generation failed, sending email without attachment:", pdfErr);
        // Continue sending email without PDF — don't block the email
      }
    }

    // Build HTML after PDF attempt so we know whether to say "attached" or "below"
    const html = buildAssessmentEmailHtml(name || "there", email, analysis, hasPdf, reportUrl);

    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
    } = {
      from: senderEmail,
      to: [email],
      subject: "Your ML Performance Assessment Results",
      html,
    };

    if (attachments) {
      emailPayload.attachments = attachments;
    }

    const { data, error } = await sendLogged(resend, "assessment_results", emailPayload);

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

    console.log("[Email] Assessment results sent to", email, "id:", data?.id, attachments ? "(with PDF)" : "(no PDF)");
    return true;
  } catch (err) {
    console.error("[Email] Failed to send assessment results:", err);
    return false;
  }
}

// ─── Send Application Notification Email to Owner ──────
export async function sendApplicationNotificationEmail(params: {
  applicantName: string;
  applicantEmail: string;
  q1_90day_goal: string;
  q2_obstacle: string;
  q3_investment: string;
  q4_anything_else?: string | null;
  assessmentScore?: number;
  weakestArea?: string;
  primaryGoal?: string;
}): Promise<boolean> {
  if (isTestEmail(params.applicantEmail)) return true; // smoke test: Marin is not alerted
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping application notification");
    return false;
  }

  try {
    const resend = getResendClient();
    const investmentLabel = params.q3_investment === "yes" ? "Yes, ready to invest" : params.q3_investment === "questions" ? "Has questions first" : "Not ready";

    const html = emailShell({
      title: "New coaching application",
      label: "New coaching application",
      footer: "Reply directly to this email to respond to the applicant",
      content: `<h2 style="color:${INK}; margin:0 0 20px 0; font-size:26px; line-height:1.15; letter-spacing:-0.4px; font-family:${HEAD_FONT};">Application from ${esc(params.applicantName)}</h2>
              ${emailRows([
                ["Email", esc(params.applicantEmail)],
                ["Investment", investmentLabel],
                params.assessmentScore ? ["Assessment Score", `<strong>${params.assessmentScore}%</strong>`] : null,
                params.primaryGoal ? ["Primary Goal", esc(params.primaryGoal)] : null,
                params.weakestArea ? ["Focus Area", esc(params.weakestArea)] : null,
              ])}
              ${emailNote("90 day goal", esc(params.q1_90day_goal))}
              ${emailNote("Biggest obstacle", esc(params.q2_obstacle))}
              ${params.q4_anything_else ? emailNote("Additional notes", esc(params.q4_anything_else)) : ""}`,
    });

    const { data, error } = await sendLogged(resend, "owner_application", {
      from: "Marin Lazic <results@marinlazic.com>",
      to: ["Marin@marinlazic.coach"],
      replyTo: params.applicantEmail,
      subject: `Coaching Application: ${params.applicantName}`,
      html,
    });

    if (error) {
      console.error("[Email] Application notification error:", error);
      return false;
    }

    console.log("[Email] Application notification sent, id:", data?.id, "reply-to:", params.applicantEmail);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send application notification:", err);
    return false;
  }
}

// ─── Send Assessment Lead Notification Email to Owner ──────
export async function sendAssessmentNotificationEmail(params: {
  name: string;
  email: string;
  occupation: string;
  primaryGoal: string;
  commitment: string;
  wearable: string;
  goalsDetail: string;
  injuries: string;
  utmLine: string;
  scoreSummary: string;
}): Promise<boolean> {
  if (isTestEmail(params.email)) return true; // smoke test: Marin is not alerted
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping assessment notification");
    return false;
  }

  try {
    const resend = getResendClient();

    const html = emailShell({
      title: "New assessment completed",
      label: "New assessment completed",
      footer: "Reply directly to this email to respond to the lead",
      content: `<h2 style="color:${INK}; margin:0 0 20px 0; font-size:26px; line-height:1.15; letter-spacing:-0.4px; font-family:${HEAD_FONT};">New assessment: ${esc(params.name || params.email)}</h2>
              ${emailRows([
                ["Name", esc(params.name)],
                ["Email", esc(params.email)],
                ["Role", esc(params.occupation)],
                ["Primary Goal", esc(params.primaryGoal)],
                ["Commitment", esc(params.commitment)],
                ["Wearable", esc(params.wearable)],
              ])}
              ${params.utmLine ? `<p style="color:${MUTE}; font-size:13px; margin:14px 0 0 0; font-family:${BODY_FONT};">Source: ${esc(params.utmLine)}</p>` : ""}
              ${emailNote("Goals", esc(params.goalsDetail))}
              ${emailNote("Injuries", esc(params.injuries))}
              <details style="margin:18px 0 0 0;">
                <summary style="color:${MUTE}; font-size:13px; cursor:pointer; font-family:${BODY_FONT};">Full answers (click to expand)</summary>
                <p style="color:${BODY}; font-size:13px; line-height:1.6; margin:8px 0 0 0; white-space:pre-wrap; font-family:${BODY_FONT};">${esc(params.scoreSummary.slice(0, 2000))}</p>
              </details>`,
    });

    const { data, error } = await sendLogged(resend, "owner_assessment", {
      from: "Marin Lazic <results@marinlazic.com>",
      to: ["Marin@marinlazic.coach"],
      replyTo: params.email,
      subject: `\u{1F525} New Assessment: ${params.name || params.email}`,
      html,
    });

    if (error) {
      console.error("[Email] Assessment notification error:", error);
      return false;
    }

    console.log("[Email] Assessment notification sent, id:", data?.id, "reply-to:", params.email);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send assessment notification:", err);
    return false;
  }
}

// ─── Send Applicant Confirmation Email ──────────────────
export async function sendApplicantConfirmationEmail(params: {
  applicantName: string;
  applicantEmail: string;
}): Promise<boolean> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping applicant confirmation");
    return false;
  }

  try {
    const resend = getResendClient();
    const firstName = params.applicantName.split(" ")[0] || "there";

    const html = emailShell({
      title: "Got your application",
      label: "Coaching application",
      content: `${greeting(firstName)}
              <p style="${P_STYLE}">I have your application. I read every one personally and will reply within 24 hours. Nothing else to do for now.</p>
              <p style="${P_STYLE} margin:24px 0 0 0;">Marin</p>`,
    });

    const { data, error } = await sendLogged(resend, "application_confirmation", {
      from: "Marin Lazic <results@marinlazic.com>",
      to: [params.applicantEmail],
      replyTo: "marin@marinlazic.coach",
      subject: "Got your application",
      html,
    });

    if (error) {
      console.error("[Email] Applicant confirmation error:", error);
      return false;
    }

    console.log("[Email] Applicant confirmation sent to", params.applicantEmail, "id:", data?.id);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send applicant confirmation:", err);
    return false;
  }
}

// ─── Shared plain email layout ──────────────────────────
function plainEmailHtml(firstName: string, paragraphs: string[], cta?: { label: string; href: string }): string {
  const body = paragraphs.map(p => `<p style="${P_STYLE}">${p}</p>`).join("");
  const button = cta ? `<p style="margin:26px 0 0 0;">${emailButton(cta.label, cta.href)}</p>` : "";
  return emailShell({
    title: "Marin Lazic",
    content: `${greeting(firstName)}
        ${body}${button}
        <p style="${P_STYLE} margin:26px 0 0 0;">Marin</p>`,
  });
}

const RESULTS_SENDER = "Marin Lazic <results@marinlazic.com>";
const OWNER_REPLY_TO = "marin@marinlazic.coach";

function firstNameOf(name?: string | null) {
  return (name || "").trim().split(" ")[0] || "there";
}

// ─── Purchase confirmation to the buyer ─────────────────
export async function sendPurchaseConfirmationEmail(params: {
  email: string;
  name?: string | null;
  productName: string;
  amountFormatted: string;
}): Promise<boolean> {
  if (!ENV.resendApiKey) return false;
  try {
    const resend = getResendClient();
    const { error } = await sendLogged(resend, "purchase_confirmation", {
      from: ENV.resendFromEmail || RESULTS_SENDER,
      to: [params.email],
      replyTo: OWNER_REPLY_TO,
      subject: `Your ${params.productName} is confirmed`,
      html: plainEmailHtml(firstNameOf(params.name), [
        `Thanks. Your payment of ${params.amountFormatted} for the ${params.productName} has gone through.`,
        "I will be in touch within one business day with your programme and how we start. If you have a question before then, reply to this email.",
      ]),
    });
    if (error) {
      console.error("[Email] Purchase confirmation failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Purchase confirmation failed:", err);
    return false;
  }
}

// ─── Abandoned assessment reminder ──────────────────────
export async function sendAssessmentReminderEmail(params: {
  email: string;
  name?: string | null;
  resumeUrl: string;
}): Promise<boolean> {
  if (!ENV.resendApiKey) return false;
  try {
    const resend = getResendClient();
    const { error } = await sendLogged(resend, "assessment_reminder", {
      from: ENV.resendFromEmail || RESULTS_SENDER,
      to: [params.email],
      replyTo: OWNER_REPLY_TO,
      subject: "Your performance assessment is waiting",
      html: plainEmailHtml(
        firstNameOf(params.name),
        [
          "You started the performance assessment and did not get to the end. Your answers are saved, so you can pick it up where you left off.",
          "It takes about five minutes to finish and you get a written report on your sleep, stress, training, nutrition and recovery.",
          "If now is not the time, no problem. The link stays open.",
        ],
        { label: "Finish your assessment", href: params.resumeUrl }
      ),
    });
    if (error) {
      console.error("[Email] Reminder failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Reminder failed:", err);
    return false;
  }
}

// ─── Enquiry confirmation ───────────────────────────────
/** The Recovery Guide, with the PDF attached and a link in case the attachment is stripped. */
export async function sendRecoveryGuideEmail(params: { email: string; firstName?: string | null }): Promise<boolean> {
  if (!ENV.resendApiKey) return false;
  try {
    const resend = getResendClient();
    const { readFile } = await import("node:fs/promises");
    const { publicFilePath } = await import("./_core/vite");
    const pdfPath = publicFilePath(RECOVERY_GUIDE.pdfPath.replace(/^\//, ""));
    let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
    try {
      attachments = [{ filename: "The Recovery Guide.pdf", content: await readFile(pdfPath), contentType: "application/pdf" }];
    } catch (err) {
      console.warn("[Email] Recovery Guide PDF not found, sending the link only:", err);
    }
    const link = `${ENV.siteOrigin}${RECOVERY_GUIDE.pdfPath}`;
    const { error } = await sendLogged(resend, "guide_delivery", {
      from: ENV.resendFromEmail || RESULTS_SENDER,
      to: [params.email],
      replyTo: OWNER_REPLY_TO,
      subject: "Your Recovery Guide",
      html: plainEmailHtml(
        firstNameOf(params.firstName),
        [
          "Here is the Recovery Guide. It is attached, and it is also at the link below if the attachment does not come through.",
          "The short version: a heavy lifting day, a long run and a week of back to back meetings each leave a different kind of fatigue, and each needs a different fix. The guide shows you how to tell them apart and what to do about each one, with the numbers.",
          "Start with the thirty second morning check in section 09, and keep section 07 for the days something goes sideways. Do it for two weeks and you will see your pattern.",
          "If you want to know where you stand across sleep, stress, training and recovery, the free assessment takes about five minutes. Reply to this email if you have a question. I read every one.",
        ],
        { label: "Open the guide", href: link }
      ),
      attachments,
    });
    if (error) {
      console.error("[Email] Recovery Guide delivery failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Recovery Guide delivery failed:", err);
    return false;
  }
}

export async function sendEnquiryConfirmationEmail(params: {
  email: string;
  name?: string | null;
  corporate?: boolean;
  speaking?: boolean;
}): Promise<boolean> {
  if (!ENV.resendApiKey) return false;
  try {
    const resend = getResendClient();
    const { error } = await sendLogged(resend, "enquiry_confirmation", {
      from: ENV.resendFromEmail || RESULTS_SENDER,
      to: [params.email],
      replyTo: OWNER_REPLY_TO,
      subject: "Got your message",
      html: plainEmailHtml(firstNameOf(params.name), [
        params.speaking
          ? "Thanks for the speaking enquiry. I have your note and will reply by email within one business day."
          : params.corporate
          ? "Thanks for the enquiry about corporate health and performance. I have your note and will reply by email within one business day."
          : "Thanks for your message. I have it and will reply by email within one business day.",
        "If it is quicker, reply to this email with any detail you want to add.",
      ]),
    });
    if (error) {
      console.error("[Email] Enquiry confirmation failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Enquiry confirmation failed:", err);
    return false;
  }
}
