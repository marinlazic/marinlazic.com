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

// ─── Markdown to HTML Converter ─────────────────────────
function markdownToHtml(md: string): string {
  let html = md;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="color:#1a1a1a; font-size:20px; font-weight:700; margin:28px 0 12px 0; font-family:\'DM Sans\',\'Inter\',sans-serif;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="color:#1a1a1a; font-size:24px; font-weight:700; margin:32px 0 16px 0; font-family:\'DM Sans\',\'Inter\',sans-serif;">$1</h2>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #C8102E; padding-left:16px; margin:16px 0; color:#4a4a4a; font-style:italic;">$1</blockquote>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0; color:#333;">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul style="padding-left:20px; margin:12px 0;">${match}</ul>`);

  // Paragraphs (lines that are not already wrapped in HTML tags)
  html = html.replace(/^(?!<[hublq])((?!<).+)$/gm, '<p style="color:#333; font-size:15px; line-height:1.7; margin:10px 0; font-family:\'Inter\',sans-serif;">$1</p>');

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
    ? `<p style="color:#333; font-size:15px; line-height:1.7; margin:0 0 16px 0; font-family:'Inter',sans-serif;"><a href="${reportUrl}" style="color:#C8102E; font-weight:600; text-decoration:none;">View your report online</a>. The link works for 90 days and includes the PDF download.</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ML Performance Assessment Results</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:'Inter','DM Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:4px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a1a; padding:32px 40px; text-align:left;">
              <span style="font-family:'DM Sans','Inter',sans-serif; font-size:28px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">ML<span style="color:#C8102E;">.</span></span>
              <p style="color:#999; font-size:12px; margin:8px 0 0 0; font-family:'Inter',sans-serif; text-transform:uppercase; letter-spacing:1px;">Performance Assessment Results</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:40px 40px 24px 40px;">
              <p style="color:#1a1a1a; font-size:18px; font-weight:600; margin:0 0 16px 0; font-family:'DM Sans','Inter',sans-serif;">Hi ${firstName},</p>
              <p style="color:#333; font-size:15px; line-height:1.7; margin:0 0 16px 0; font-family:'Inter',sans-serif;">Here is your personalised performance analysis based on your recent assessment. This is the same framework I use with Olympic athletes and high-performing executives. ${pdfLine}</p>
              <p style="color:#333; font-size:15px; line-height:1.7; margin:0 0 16px 0; font-family:'Inter',sans-serif;">Read it carefully. There are specific protocols in here you can start implementing today.</p>
              ${reportLinkBlock}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:2px; background-color:#C8102E; width:48px;"></div>
            </td>
          </tr>

          <!-- Analysis Content -->
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              ${analysisHtml}
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding:0 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8f8f8; border-radius:4px; border-left:3px solid #C8102E;">
                <tr>
                  <td style="padding:28px 24px;">
                    <p style="color:#1a1a1a; font-size:18px; font-weight:700; margin:0 0 12px 0; font-family:'DM Sans','Inter',sans-serif;">Ready to Go Further?</p>
                    <p style="color:#333; font-size:15px; line-height:1.7; margin:0 0 20px 0; font-family:'Inter',sans-serif;">If you want a personalised program built around these results, the same system I use with Olympic athletes, apply below. I work with a limited number of clients and every program is built from your data, your goals, and your life.</p>
                    <a href="https://www.marinlazic.com/apply?email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName)}&utm_source=assessment&utm_medium=email&utm_campaign=results" style="display:inline-block; background-color:#C8102E; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:2px; font-family:'DM Sans','Inter',sans-serif; letter-spacing:0.5px;">APPLY FOR COACHING</a>
                    <p style="color:#666; font-size:13px; margin:12px 0 0 0; font-family:'Inter',sans-serif;">Short application. I reply personally within 24 hours.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1a1a1a; padding:24px 40px; text-align:center;">
              <p style="color:#999; font-size:12px; margin:0 0 4px 0; font-family:'Inter',sans-serif;">Marin Lazic | Health & Performance Coach</p>
              <p style="color:#666; font-size:11px; margin:0; font-family:'Inter',sans-serif;">
                <a href="https://www.marinlazic.com" style="color:#999; text-decoration:none;">marinlazic.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:'Inter',sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:4px;">
          <tr>
            <td style="background-color:#1a1a1a; padding:24px 32px;">
              <span style="font-size:24px; font-weight:700; color:#fff;">ML<span style="color:#C8102E;">.</span></span>
              <span style="color:#999; font-size:12px; margin-left:16px; text-transform:uppercase; letter-spacing:1px;">New Coaching Application</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#1a1a1a; margin:0 0 24px 0; font-size:22px;">Application from ${params.applicantName}</h2>
              <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:8px 0; color:#666; font-size:13px; width:140px;">Email</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.applicantEmail}</td></tr>
                <tr><td style="padding:8px 0; color:#666; font-size:13px;">Investment</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${investmentLabel}</td></tr>
                ${params.assessmentScore ? `<tr><td style="padding:8px 0; color:#666; font-size:13px;">Assessment Score</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px; font-weight:600;">${params.assessmentScore}%</td></tr>` : ""}
                ${params.primaryGoal ? `<tr><td style="padding:8px 0; color:#666; font-size:13px;">Primary Goal</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.primaryGoal}</td></tr>` : ""}
                ${params.weakestArea ? `<tr><td style="padding:8px 0; color:#666; font-size:13px;">Focus Area</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.weakestArea}</td></tr>` : ""}
              </table>
              <div style="margin:24px 0; padding:20px; background:#f8f8f8; border-left:3px solid #C8102E;">
                <p style="color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px 0;">90-Day Goal</p>
                <p style="color:#1a1a1a; font-size:15px; line-height:1.6; margin:0;">${params.q1_90day_goal}</p>
              </div>
              <div style="margin:24px 0; padding:20px; background:#f8f8f8; border-left:3px solid #1a1a1a;">
                <p style="color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px 0;">Biggest Obstacle</p>
                <p style="color:#1a1a1a; font-size:15px; line-height:1.6; margin:0;">${params.q2_obstacle}</p>
              </div>
              ${params.q4_anything_else ? `<div style="margin:24px 0; padding:20px; background:#f8f8f8; border-left:3px solid #666;">
                <p style="color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px 0;">Additional Notes</p>
                <p style="color:#1a1a1a; font-size:15px; line-height:1.6; margin:0;">${params.q4_anything_else}</p>
              </div>` : ""}
              <p style="color:#666; font-size:13px; margin:24px 0 0 0;">Reply directly to this email to respond to the applicant.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:'Inter',sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:4px;">
          <tr>
            <td style="background-color:#1a1a1a; padding:24px 32px;">
              <span style="font-size:24px; font-weight:700; color:#fff;">ML<span style="color:#C8102E;">.</span></span>
              <span style="color:#999; font-size:12px; margin-left:16px; text-transform:uppercase; letter-spacing:1px;">New Assessment Completed</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#1a1a1a; margin:0 0 24px 0; font-size:22px;">New Assessment: ${params.name || params.email}</h2>
              <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:8px 0; color:#666; font-size:13px; width:120px;">Name</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.name}</td></tr>
                <tr><td style="padding:8px 0; color:#666; font-size:13px;">Email</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.email}</td></tr>
                <tr><td style="padding:8px 0; color:#666; font-size:13px;">Role</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.occupation}</td></tr>
                <tr><td style="padding:8px 0; color:#666; font-size:13px;">Primary Goal</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.primaryGoal}</td></tr>
                <tr><td style="padding:8px 0; color:#666; font-size:13px;">Commitment</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.commitment}</td></tr>
                <tr><td style="padding:8px 0; color:#666; font-size:13px;">Wearable</td><td style="padding:8px 0; color:#1a1a1a; font-size:15px;">${params.wearable}</td></tr>
              </table>
              ${params.utmLine ? `<p style="color:#666; font-size:12px; margin:16px 0 0 0;">Source: ${params.utmLine}</p>` : ""}
              <div style="margin:24px 0; padding:20px; background:#f8f8f8; border-left:3px solid #C8102E;">
                <p style="color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px 0;">Goals</p>
                <p style="color:#1a1a1a; font-size:15px; line-height:1.6; margin:0;">${params.goalsDetail}</p>
              </div>
              <div style="margin:24px 0; padding:20px; background:#f8f8f8; border-left:3px solid #1a1a1a;">
                <p style="color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px 0;">Injuries</p>
                <p style="color:#1a1a1a; font-size:15px; line-height:1.6; margin:0;">${params.injuries}</p>
              </div>
              <details style="margin:16px 0;">
                <summary style="color:#666; font-size:13px; cursor:pointer;">Full answers (click to expand)</summary>
                <p style="color:#333; font-size:13px; line-height:1.6; margin:8px 0 0 0; white-space:pre-wrap;">${params.scoreSummary.slice(0, 2000)}</p>
              </details>
              <p style="color:#666; font-size:13px; margin:24px 0 0 0;">Reply directly to this email to respond to the lead.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:'Inter',sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:4px;">
          <tr>
            <td style="background-color:#1a1a1a; padding:24px 32px;">
              <span style="font-size:24px; font-weight:700; color:#fff;">ML<span style="color:#C8102E;">.</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="color:#1a1a1a; font-size:16px; line-height:1.7; margin:0 0 16px 0;">Hi ${firstName},</p>
              <p style="color:#333; font-size:15px; line-height:1.7; margin:0 0 16px 0;">I have your application. I read every one personally and will reply within 24 hours. Nothing else to do for now.</p>
              <p style="color:#333; font-size:15px; line-height:1.7; margin:0;">Marin</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1a1a1a; padding:16px 32px; text-align:center;">
              <p style="color:#666; font-size:11px; margin:0; font-family:'Inter',sans-serif;">
                <a href="https://www.marinlazic.com" style="color:#999; text-decoration:none;">marinlazic.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
  const body = paragraphs
    .map(
      p =>
        `<p style="color:#333; font-size:15px; line-height:1.7; margin:0 0 16px 0; font-family:'Inter',sans-serif;">${p}</p>`
    )
    .join("");
  const button = cta
    ? `<p style="margin:24px 0 0 0;"><a href="${cta.href}" style="display:inline-block; background-color:#C8102E; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:2px; font-family:'DM Sans','Inter',sans-serif; letter-spacing:0.5px;">${cta.label}</a></p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:'Inter','DM Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f5;"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:4px; overflow:hidden;">
      <tr><td style="background-color:#1a1a1a; padding:24px 40px;"><span style="font-family:'DM Sans','Inter',sans-serif; font-size:28px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">ML<span style="color:#C8102E;">.</span></span></td></tr>
      <tr><td style="padding:36px 40px 32px 40px;">
        <p style="color:#1a1a1a; font-size:18px; font-weight:600; margin:0 0 16px 0; font-family:'DM Sans','Inter',sans-serif;">Hi ${firstName},</p>
        ${body}${button}
        <p style="color:#333; font-size:15px; line-height:1.7; margin:24px 0 0 0; font-family:'Inter',sans-serif;">Marin</p>
      </td></tr>
      <tr><td style="background-color:#1a1a1a; padding:20px 40px; text-align:center;"><p style="color:#999; font-size:12px; margin:0; font-family:'Inter',sans-serif;">Marin Lazic | <a href="https://marinlazic.com" style="color:#999; text-decoration:none;">marinlazic.com</a></p></td></tr>
    </table>
  </td></tr></table>
</body></html>`;
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
          "Start with the thirty second morning check in section 07. Do it for two weeks and you will see your pattern.",
          "If you want to know where you stand across sleep, stress, training and recovery, the free assessment takes about ten minutes. Reply to this email if you have a question. I read every one.",
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
