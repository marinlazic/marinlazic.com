import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import {
  createLead,
  getLeads,
  updateLeadStatus,
  getLeadStats,
  trackEvent,
  getAnalyticsStats,
  createApplication,
  getApplications,
  saveAssessmentProgress,
  markAssessmentCompleted,
  getAssessmentByResumeToken,
  getCompletedAssessmentByEmail,
  getAllAssessmentProgress,
  createAssessmentReport,
  getAssessmentReportByToken,
  getReportTokensByEmails,
  upsertApplicantLead,
  getLatestLeadByEmail,
} from "./db";
import {
  kitOnEmailCapture,
  kitOnAssessmentComplete,
  kitOnApplicationSubmit,
  kitOnEnquiry,
} from "./kit";
import { z } from "zod/v4";
import { XMLParser } from "fast-xml-parser";
import { createCheckoutSession, retrieveCheckoutSession } from "./stripe";
import { PRODUCTS } from "./products";
import {
  sendAssessmentResultsEmail,
  sendApplicationNotificationEmail,
  sendAssessmentNotificationEmail,
  sendApplicantConfirmationEmail,
  sendEnquiryConfirmationEmail,
} from "./email";
import { generateAssessmentPDF } from "./pdf";
import { storagePut, storageConfigured } from "./storage";
import { calculateScores, getScoreBand } from "@shared/assessment";
import { ENV } from "./_core/env";
import { randomBytes } from "node:crypto";

const REPORT_TTL_DAYS = 90;

function newToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

function reportUrlFor(token: string) {
  return `${ENV.siteOrigin}/report/${token}`;
}

// ─── Substack RSS Feed ───────────────────────────────────
const SUBSTACK_FEED_URL = "https://marinlazic.substack.com/feed";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

type SubstackArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string | null;
};

let articlesCache: { data: SubstackArticle[]; fetchedAt: number } | null = null;

async function fetchSubstackArticles(limit = 3): Promise<SubstackArticle[]> {
  if (articlesCache && Date.now() - articlesCache.fetchedAt < CACHE_TTL) {
    return articlesCache.data.slice(0, limit);
  }

  try {
    const res = await fetch(SUBSTACK_FEED_URL, {
      headers: { "User-Agent": "MarinLazicSite/1.0" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const feed = parser.parse(xml);
    const items = feed?.rss?.channel?.item;
    if (!items) return [];

    const itemList = Array.isArray(items) ? items : [items];
    const articles: SubstackArticle[] = itemList.map((item: any) => ({
      title: item.title || "",
      description: item.description || "",
      link: item.link || "",
      pubDate: item.pubDate || "",
      image: item.enclosure?.["@_url"] || null,
    }));

    articlesCache = { data: articles, fetchedAt: Date.now() };
    return articles.slice(0, limit);
  } catch (err) {
    console.warn("[Articles] Failed to fetch Substack RSS:", err);
    if (articlesCache) return articlesCache.data.slice(0, limit);
    return [];
  }
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ─── LLM Analysis Generator ─────────────────────────────
async function generatePerformanceAnalysis(
  answers: Record<string, unknown>
): Promise<string> {
  const systemPrompt = `You are Marin Lazic, an elite Health and Performance Coach based in Sydney, Australia. You are the Strength & Conditioning Coach for the Australian Men's Water Polo Team (Paris 2024 Olympics). You speak directly, with authority and warmth. You use Australian English spelling.

You are writing a personalised performance analysis for a potential coaching client based on their assessment answers. This is AI-assisted coaching education from self-reported answers, not a clinical consultation.

VOICE & TONE:
- Direct, no-nonsense, but warm and encouraging
- Use "you" language, speak to them personally
- Reference their specific answers throughout
- Be honest about what needs work. State uncertainty.
- Use analogies from sport and coaching
- Australian English spelling and short, plain sentences.

STRUCTURE YOUR ANALYSIS EXACTLY LIKE THIS:

## Your Performance Profile

A 2-3 paragraph overview addressing them by name. Reference their occupation, goals, and overall score. Be specific about what you see in their data. Make them feel understood.

### Sleep Analysis
Specific analysis of their sleep answers. What's working, what's not. Include one concrete protocol they can implement tonight.

### Stress & Mental Performance
Analysis of their stress profile relative to their occupation. Specific recommendations.

### Training Assessment
Evaluate their current training against their goals. What's missing. What needs to change.

### Injury & Health Considerations
Address any injuries or health concerns they mentioned. How this affects programming.

### Nutrition & Energy
Connect their energy levels to their nutrition. Specific, actionable advice.

### Recovery Profile
Evaluate their recovery practices. If they do not track biometrics (HRV, resting heart rate, sleep), explain why a wearable like WHOOP, Oura, or Apple Watch is valuable for data-driven decisions.

### The Bottom Line
Close with a short summary of the next practical steps, their limits and how coaching may help. Do not pressure the reader or promise results.

IMPORTANT RULES:
- Treat assessment answers as unverified self-reports, not objective clinical findings.
- Explicitly state that this is AI-assisted coaching education, not diagnosis or treatment.
- Do not diagnose burnout, blood sugar, hormone, injury, kidney, heart or sleep conditions from answers or wearable numbers.
- HRV and wearable readings are device-dependent personal trends. Do not rank health from universal cut-offs or claim they predict burnout.
- Direct persistent fatigue, pain, sleep problems, mental health concerns and relevant symptoms to qualified healthcare professionals. Urgent symptoms need urgent care.
- Do not prescribe supplements, medicines, diagnostic blood tests or injury rehabilitation. Individual dietary and medical questions need the appropriate qualified clinician.
- Do not promise numerical HRV, recovery, productivity or lifespan improvements. Associations are not guarantees.
- Breathing can support calm; the cited month-long breathing trial did not significantly improve HRV, resting heart rate or sleep.
- No em dashes. Avoid not just X but Y constructions, hype and these terms: move the needle, elevate, delve, revolutionize, foster, leverage, synergy, optimize, optimise, empower, innovative, robust, seamless, holistic, cutting-edge, game-changer, deep dive, actionable insights, unlock, dive into.
- Reference their SPECIFIC answers, not generic advice
- Include at least 2-3 specific protocols or actionable steps per section
- Use data points (HRV, resting heart rate, sleep metrics) where relevant
- If they mentioned injuries, address them specifically
- If their commitment level is "all in" or "ready", match that energy
- Keep the total analysis between 800-1200 words
- Use markdown formatting (##, ###, -, **, >)
- Do NOT use emoji
- Do NOT mention pricing or specific dollar amounts in the analysis
- Most adults generally need 7-9 hours of sleep. Explain that individual sleep needs and health context vary; persistent sleep concerns need clinical advice.
- Do NOT pitch WHOOP specifically. If recommending wearables, say "a wearable like WHOOP, Oura, or Apple Watch" and move on. Do not dedicate a paragraph to any single product.`;

  const userPrompt = `Here are the assessment answers from a potential client. Generate their personalised performance analysis.

ASSESSMENT DATA:
${JSON.stringify(answers, null, 2)}

Remember: Write as Marin Lazic. Be specific to THEIR answers. This should feel like a real coaching consultation, not a template.`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = result.choices?.[0]?.message?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map(c => (c.type === "text" ? c.text : "")).join("");
    }
    return "Analysis generation failed. Please contact us directly.";
  } catch (err) {
    console.error("[Assessment] LLM analysis failed:", err);
    throw new Error("Failed to generate analysis");
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  assessment: router({
    submit: publicProcedure
      .input(
        z.object({
          answers: z.record(
            z.string(),
            z.union([z.string(), z.array(z.string())])
          ),
          utmSource: z.string().optional(),
          utmMedium: z.string().optional(),
          utmCampaign: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const clientKey =
          ctx.req.ip ||
          ctx.req.headers["x-forwarded-for"]?.toString() ||
          "unknown";
        if (!checkRateLimit(clientKey)) {
          throw new Error("Too many submissions. Please try again later.");
        }

        const { answers, utmSource, utmMedium, utmCampaign } = input;
        const email = (answers.email as string) || "";
        const name = (answers.name as string) || "";

        // Build a summary of scored answers for the lead record
        const scoreSummary = Object.entries(answers)
          .filter(([_, v]) => typeof v === "string" || Array.isArray(v))
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");

        // Save lead to database
        const leadId = await createLead({
          email,
          name: name || null,
          source: "performance-assessment-v2",
          message: scoreSummary.slice(0, 5000),
        });

        // Generate LLM analysis
        const analysis = await generatePerformanceAnalysis(answers);

        // One scoring function for the screen, the PDF and Kit.
        const scores = calculateScores(answers);

        // Build the PDF once, store it, and save the report behind a token.
        let pdfBuffer: Buffer | undefined;
        let reportToken: string | undefined;
        try {
          pdfBuffer = await generateAssessmentPDF({ name: name || "Your Results", analysis, answers });
        } catch (e) {
          console.warn("[Assessment] PDF generation failed:", e);
        }
        try {
          const token = newToken();
          let pdfKey: string | null = null;
          if (pdfBuffer && storageConfigured()) {
            const stored = await storagePut(`reports/${token}.pdf`, pdfBuffer, "application/pdf");
            pdfKey = stored.key;
          }
          const expiresAt = new Date(Date.now() + REPORT_TTL_DAYS * 24 * 60 * 60 * 1000);
          await createAssessmentReport({
            token,
            email,
            name: name || null,
            answers,
            scores: {
              overallPct: scores.overallPct,
              band: getScoreBand(scores.overallPct),
              categories: scores.categories,
            },
            analysis,
            pdfKey,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            expiresAt,
          });
          reportToken = token;
        } catch (e) {
          console.warn("[Assessment] Failed to save report:", e);
        }

        // Notify owner via Resend email (from results@marinlazic.com)
        try {
          const occupation = answers.occupation || "Not specified";
          const primaryGoal = answers["primary-goal"] || "Not specified";
          const commitment = answers.commitment || "Not specified";
          const hasWhoop = answers["has-whoop"] || "Not specified";
          const goalsDetail = answers["goals-detail"] || "Not specified";
          const injuries = answers["injury-detail"] || "None mentioned";

          const utmLine =
            utmSource || utmMedium || utmCampaign
              ? `${utmSource || "direct"} / ${utmMedium || "none"} / ${utmCampaign || "none"}`
              : "";

          await sendAssessmentNotificationEmail({
            name: name || "Unknown",
            email,
            occupation: occupation as string,
            primaryGoal: primaryGoal as string,
            commitment: commitment as string,
            wearable: hasWhoop as string,
            goalsDetail: goalsDetail as string,
            injuries: injuries as string,
            utmLine,
            scoreSummary,
          });
        } catch (e) {
          console.warn("[Assessment] Failed to notify owner:", e);
        }

        // Mark assessment as completed
        try {
          await markAssessmentCompleted(email);
        } catch (e) {
          console.warn("[Assessment] Failed to mark progress completed:", e);
        }

        // Kit: tag assessment-completed and write custom fields
        try {
          const occupation = (answers.occupation as string) || "";
          const primaryGoal = (answers["primary-goal"] as string) || "";
          const commitment = (answers.commitment as string) || "";
          kitOnAssessmentComplete(email, {
            score: scores.overallPct,
            weakestArea: scores.weakest?.id ?? "",
            strongestArea: scores.strongest?.id ?? "",
            primaryGoal,
            role: occupation,
            commitmentLevel: commitment,
            utmSource,
            utmMedium,
            utmCampaign,
          });
        } catch (e) {
          console.warn("[Assessment] Kit assessment-completed call failed:", e);
        }

        // Send assessment results to user via email with PDF attachment (non-blocking)
        try {
          await sendAssessmentResultsEmail({
            email,
            name,
            analysis,
            answers,
            pdfBuffer,
            reportUrl: reportToken ? reportUrlFor(reportToken) : undefined,
          });
        } catch (e) {
          console.warn("[Assessment] Failed to send results email:", e);
        }

        return {
          success: true,
          analysis,
          reportToken: reportToken ?? null,
          reportUrl: reportToken ? reportUrlFor(reportToken) : null,
          leadId: leadId ?? null,
          scores: { overallPct: scores.overallPct, categories: scores.categories },
        };
      }),

    saveProgress: publicProcedure
      .input(
        z.object({
          email: z.string(),
          name: z.string().optional(),
          answers: z.record(
            z.string(),
            z.union([z.string(), z.array(z.string())])
          ),
          answeredCount: z.number(),
          totalQuestions: z.number(),
          utmSource: z.string().optional(),
          utmMedium: z.string().optional(),
          utmCampaign: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const resumeToken = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
        const token = await saveAssessmentProgress({
          email: input.email,
          name: input.name || null,
          answers: JSON.stringify(input.answers),
          answeredCount: input.answeredCount,
          totalQuestions: input.totalQuestions,
          resumeToken,
          utmSource: input.utmSource || null,
          utmMedium: input.utmMedium || null,
          utmCampaign: input.utmCampaign || null,
        });

        // Kit: create/update subscriber and tag assessment-started (async, non-blocking)
        kitOnEmailCapture(input.email, input.name);

        return { resumeToken: token };
      }),

    getProgress: publicProcedure
      .input(z.object({ resumeToken: z.string() }))
      .query(async ({ input }) => {
        const progress = await getAssessmentByResumeToken(input.resumeToken);
        if (!progress) return null;
        return {
          email: progress.email,
          name: progress.name,
          answers: progress.answers ? JSON.parse(progress.answers) : {},
          answeredCount: progress.answeredCount,
          completed: progress.completed,
        };
      }),
  }),

  leads: router({
    submit: publicProcedure
      .input(
        z.object({
          email: z.email(),
          name: z.string().optional(),
          source: z.string().optional(),
          message: z.string().optional(),
          corporate: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const clientKey =
          ctx.req.ip ||
          ctx.req.headers["x-forwarded-for"]?.toString() ||
          "unknown";
        if (!checkRateLimit(clientKey)) {
          throw new Error("Too many submissions. Please try again later.");
        }

        const corporate = Boolean(input.corporate) || /corporate/i.test(input.source || "");
        await createLead({
          email: input.email,
          name: input.name || null,
          source: input.source || "direct",
          message: input.message || null,
        });

        kitOnEnquiry(input.email, input.name, corporate);
        try {
          await sendEnquiryConfirmationEmail({ email: input.email, name: input.name, corporate });
        } catch (e) {
          console.warn("[Leads] Failed to send enquiry confirmation:", e);
        }

        try {
          const nameLine = input.name ? `Name: ${input.name}\n` : "";
          const msgLine = input.message ? `\nDetails: ${input.message}` : "";
          await notifyOwner({
            title: "New Lead Submission",
            content: `${nameLine}New lead from: ${input.email}\nSource: ${input.source || "direct"}\nTime: ${new Date().toISOString()}${msgLine}`,
          });
        } catch (e) {
          console.warn("[Leads] Failed to notify owner:", e);
        }

        return { success: true };
      }),

    list: adminProcedure
      .input(
        z
          .object({
            status: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const rows = await getLeads({
          status: input?.status,
          startDate: input?.startDate ? new Date(input.startDate) : undefined,
          endDate: input?.endDate ? new Date(input.endDate) : undefined,
        });
        const tokens = await getReportTokensByEmails(rows.map(r => r.email));
        return rows.map(r => ({
          ...r,
          reportToken: tokens.get(r.email.toLowerCase()) ?? null,
        }));
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "applied", "converted", "archived"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateLeadStatus(input.id, input.status, input.notes);
        return { success: true };
      }),

    stats: adminProcedure.query(async () => {
      return getLeadStats();
    }),

    applications: adminProcedure.query(async () => getApplications()),

    assessmentProgress: adminProcedure.query(async () =>
      (await getAllAssessmentProgress()).map(row => ({ ...row, answers: undefined }))
    ),
  }),

  report: router({
    get: publicProcedure
      .input(z.object({ token: z.string().min(10).max(80) }))
      .query(async ({ input }) => {
        const report = await getAssessmentReportByToken(input.token);
        if (!report) return null;
        return {
          name: report.name,
          email: report.email,
          analysis: report.analysis,
          scores: report.scores as { overallPct: number; band: string; categories: { id: string; name: string; percentage: number }[] },
          createdAt: report.createdAt,
          expiresAt: report.expiresAt,
          hasPdf: Boolean(report.pdfKey),
          pdfUrl: `/api/report/${report.token}/pdf`,
        };
      }),
  }),

  articles: router({
    latest: publicProcedure
      .input(
        z.object({ limit: z.number().min(1).max(10).optional() }).optional()
      )
      .query(async ({ input }) => {
        const articles = await fetchSubstackArticles(input?.limit ?? 3);
        return articles;
      }),
  }),

  checkout: router({
    createSession: publicProcedure
      .input(
        z.object({
          productId: z.string(),
          email: z.string(),
          name: z.string().optional(),
          origin: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const productKey = Object.keys(PRODUCTS).find(
          k => PRODUCTS[k as keyof typeof PRODUCTS].id === input.productId
        ) as keyof typeof PRODUCTS | undefined;

        if (!productKey) {
          throw new Error(`Unknown product: ${input.productId}`);
        }

        const lead = await getLatestLeadByEmail(input.email).catch(() => null);
        const result = await createCheckoutSession({
          productId: productKey,
          customerEmail: input.email,
          customerName: input.name,
          leadId: lead?.id,
          origin: input.origin,
        });

        return { url: result.url, sessionId: result.sessionId };
      }),

    getSession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = await retrieveCheckoutSession(input.sessionId);
        return {
          status: session.status,
          paymentStatus: session.payment_status,
          customerEmail:
            session.customer_email || session.metadata?.customer_email || "",
          productId: session.metadata?.product_id || "",
        };
      }),
  }),

  application: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.email(),
          q1_90day_goal: z.string().min(1),
          q2_obstacle: z.string().min(1),
          q3_investment: z.enum(["yes", "questions", "no"]),
          q4_anything_else: z.string().optional(),
          utmSource: z.string().optional(),
          utmMedium: z.string().optional(),
          utmCampaign: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const clientKey =
          ctx.req.ip ||
          ctx.req.headers["x-forwarded-for"]?.toString() ||
          "unknown";
        if (!checkRateLimit(clientKey)) {
          throw new Error("Too many submissions. Please try again later.");
        }

        // Fetch assessment data for this applicant (if they completed one)
        let assessmentData: {
          score?: number;
          weakestArea?: string;
          primaryGoal?: string;
        } = {};
        try {
          const assessment = await getCompletedAssessmentByEmail(input.email);
          if (assessment && assessment.answers) {
            const answers = JSON.parse(assessment.answers);
            const scores = calculateScores(answers);
            assessmentData = {
              score: scores.overallPct,
              weakestArea: scores.weakest?.id,
              primaryGoal:
                (answers["primary-goal"] as string) ||
                (answers["goals-detail"] as string) ||
                undefined,
            };
          }
        } catch (e) {
          console.warn("[Application] Failed to fetch assessment data:", e);
        }

        // Save application to database (with UTM and assessment data)
        await createApplication({
          name: input.name,
          email: input.email,
          q1_90day_goal: input.q1_90day_goal,
          q2_obstacle: input.q2_obstacle,
          q3_investment: input.q3_investment,
          q4_anything_else: input.q4_anything_else || null,
          assessmentData: assessmentData.score
            ? JSON.stringify(assessmentData)
            : null,
          utmSource: input.utmSource || null,
          utmMedium: input.utmMedium || null,
          utmCampaign: input.utmCampaign || null,
        });

        // Every applicant appears in the leads table.
        try {
          await upsertApplicantLead({
            email: input.email,
            name: input.name,
            message: `Coaching application. 90 day goal: ${input.q1_90day_goal.slice(0, 300)}`,
          });
        } catch (e) {
          console.warn("[Application] Failed to upsert applicant lead:", e);
        }

        // Kit: tag application-submitted
        kitOnApplicationSubmit(input.email, input.name);

        // Send formatted application notification email with reply-to set to applicant
        try {
          await sendApplicationNotificationEmail({
            applicantName: input.name,
            applicantEmail: input.email,
            q1_90day_goal: input.q1_90day_goal,
            q2_obstacle: input.q2_obstacle,
            q3_investment: input.q3_investment,
            q4_anything_else: input.q4_anything_else,
            assessmentScore: assessmentData.score,
            weakestArea: assessmentData.weakestArea,
            primaryGoal: assessmentData.primaryGoal,
          });
        } catch (e) {
          console.warn("[Application] Failed to send notification email:", e);
        }

        // Send applicant confirmation email (non-blocking)
        try {
          await sendApplicantConfirmationEmail({
            applicantName: input.name,
            applicantEmail: input.email,
          });
        } catch (e) {
          console.warn(
            "[Application] Failed to send applicant confirmation:",
            e
          );
        }

        return { success: true };
      }),
  }),

  analytics: router({
    track: publicProcedure
      .input(
        z.object({
          eventType: z.string().max(100),
          eventData: z.string().max(20_000).optional(),
          sessionId: z.string().max(100).optional(),
          // An empty string explicitly represents direct traffic. When omitted,
          // legacy callers retain the request-header fallback below.
          referrer: z
            .string()
            .max(2_048)
            .refine(value => {
              if (value === "") return true;
              try {
                const url = new URL(value);
                return url.protocol === "http:" || url.protocol === "https:";
              } catch {
                return false;
              }
            }, "Referrer must be an HTTP(S) URL or an empty string")
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const suppliedReferrer =
          input.referrer ?? ctx.req.headers["referer"]?.toString();
        let referrer: string | undefined;

        if (suppliedReferrer === "") {
          referrer = "";
        } else if (suppliedReferrer) {
          try {
            const url = new URL(suppliedReferrer);
            if (url.protocol === "http:" || url.protocol === "https:") {
              // Never retain query strings, fragments, or credentials; client
              // metadata is informational only and not proof of attribution.
              referrer = `${url.origin}${url.pathname}`.slice(0, 500);
            }
          } catch {
            // Legacy header values may be malformed; omit rather than store.
          }
        }

        await trackEvent({
          eventType: input.eventType,
          eventData: input.eventData,
          sessionId: input.sessionId,
          userAgent: ctx.req.headers["user-agent"]?.toString(),
          referrer,
        });
        return { success: true };
      }),

    stats: adminProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getAnalyticsStats(input?.days ?? 30);
      }),
  }),
});

export type AppRouter = typeof appRouter;
