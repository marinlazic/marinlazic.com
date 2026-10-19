// Where each lead stands and what Marin should do next.
//
// A contact's story is every form, application, purchase, site email and
// Gmail message in date order. From that come a stage, a priority and (for
// the open stages) a drafted reply written by Gemini in Marin's voice. The
// drafts are stored in contact_followups and only rewritten when the story
// changes, so the daily job costs cents.
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { contactFollowups, conversationEvents, leads } from "../drizzle/schema";
import { answerLabel, answersFromMessage, leadKind, parseAnswers, summariseScores } from "./contactAnswers";
import { EMAIL_KIND_LABELS, type EmailKind } from "./emailLog";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { isTestEmail } from "../shared/testData";

export const STAGES = ["Reply owed", "Never replied", "Won", "Waiting on lead", "Gone quiet"] as const;
export type Stage = (typeof STAGES)[number];
export type Priority = "High" | "Medium" | "Low";
export type EventKind = "form" | "application" | "purchase" | "sent" | "reply" | "auto";

export type StoryEvent = {
  id: string;
  email: string;
  kind: EventKind;
  channel: string;
  at: string;
  subject: string | null;
  snippet: string | null;
  origin: string;
  promise?: boolean;
};

export type FollowupLead = {
  email: string;
  leadId: number | null;
  name: string;
  firstName: string;
  role: string | null;
  source: string;
  firstSeen: string;
  goal: string | null;
  commitment: string;
  commitmentValue: string | null;
  injuries: string | null;
  score: number | null;
  weakest: string | null;
  strongest: string | null;
  status: string;
  product: string | null;
  stage: Stage;
  priority: Priority;
  sent: number;
  replies: number;
  lastContact: string;
  lastBy: "You" | "Lead";
  waitingSince: string;
  days: number;
  won: boolean;
  promised: boolean;
  needsDraft: boolean;
  nextAction: string | null;
  draftSubject: string | null;
  draftBody: string | null;
  draftedAt: string | null;
  history: string;
};

const GONE_QUIET_DAYS = 21;
const NUDGE_DAYS = 5;
const DAY = 86_400_000;

// ─── Rules ──────────────────────────────────────────────────────────────────

export type Standing = {
  stage: Stage;
  priority: Priority;
  sent: number;
  replies: number;
  won: boolean;
  lastHuman: StoryEvent | null;
  waitingSince: string;
  lastContact: string;
  lastBy: "You" | "Lead";
  days: number;
  needsDraft: boolean;
  nextActionFixed: string | null;
  promised: boolean;
};

const HUMAN: EventKind[] = ["form", "application", "purchase", "sent", "reply"];

/** The stage rules. Pure, so they can be tested. */
export function standing(events: StoryEvent[], commitmentValue: string | null, now = new Date()): Standing {
  const sorted = events.slice().sort((a, b) => a.at.localeCompare(b.at));
  const human = sorted.filter(e => HUMAN.includes(e.kind));
  const sent = human.filter(e => e.kind === "sent").length;
  const replies = human.filter(e => e.kind === "reply").length;
  const purchase = human.find(e => e.kind === "purchase") ?? null;
  const won = Boolean(purchase);
  const last = human[human.length - 1] ?? sorted[sorted.length - 1] ?? null;
  const first = human[0] ?? sorted[0] ?? null;
  const daysSince = (iso: string | null | undefined) => (iso ? Math.max(0, Math.floor((now.getTime() - Date.parse(iso)) / DAY)) : 0);

  // A reply from them, or a promise from Marin, puts the ball with Marin.
  let stage: Stage;
  if (last && (last.kind === "reply" || (last.kind === "sent" && last.promise))) stage = "Reply owed";
  else if (won) stage = "Won";
  else if (sent === 0) stage = "Never replied";
  else if (last && last.kind !== "sent") stage = "Reply owed";
  else if (daysSince(last?.at) >= GONE_QUIET_DAYS) stage = "Gone quiet";
  else stage = "Waiting on lead";

  const waitingSince = last?.at ?? now.toISOString();
  const days = daysSince(waitingSince);
  const lastBy: "You" | "Lead" = last?.kind === "sent" ? "You" : "Lead";
  const promised = Boolean(last && last.kind === "sent" && last.promise);
  const keen = commitmentValue === "all-in" || commitmentValue === "locked-in" || commitmentValue === "ready";

  let priority: Priority;
  let needsDraft = true;
  let nextActionFixed: string | null = null;
  if (stage === "Won") {
    const welcomed = purchase ? human.some(e => e.kind === "sent" && e.at > purchase.at) : false;
    const sincePurchase = daysSince(purchase?.at);
    // A welcome is urgent in the first month; after that it becomes a check in.
    priority = welcomed ? "Low" : sincePurchase <= 30 ? "High" : "Medium";
    if (welcomed) {
      needsDraft = false;
      nextActionFixed = "They have bought and you have been in touch. Check in when their first block ends.";
    }
  } else if (stage === "Reply owed") {
    priority = "High";
  } else if (stage === "Never replied") {
    const age = daysSince(first?.at);
    priority = age <= 14 || (keen && age <= 45) ? "High" : age <= 90 ? "Medium" : "Low";
  } else if (stage === "Waiting on lead") {
    priority = days >= NUDGE_DAYS ? "Medium" : "Low";
    if (days < NUDGE_DAYS) {
      needsDraft = false;
      nextActionFixed = `You wrote ${days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`}. Give them until day ${NUDGE_DAYS} before a nudge.`;
    }
  } else {
    priority = "Low";
    needsDraft = false;
    nextActionFixed = `No reply after ${sent} email${sent === 1 ? "" : "s"} from you. Leave it, or send one short note in a month.`;
  }

  return { stage, priority, sent, replies, won, lastHuman: last, waitingSince, lastContact: last?.at ?? waitingSince, lastBy, days, needsDraft, nextActionFixed, promised };
}

// ─── Labels ─────────────────────────────────────────────────────────────────

const COMMITMENT: Record<string, string> = { curious: "Curious", thinking: "Thinking", ready: "Ready", "all-in": "All in", "locked-in": "All in", questions: "Has questions first", bought: "Bought" };
const humanise = (v: string) => v.replace(/[-_]+/g, " ").replace(/^\w/, c => c.toUpperCase());
const ROLE: Record<string, string> = { executive: "Executive", "senior-leader": "Senior leader", professional: "Professional", athlete: "Athlete", entrepreneur: "Entrepreneur", other: "Other" };

export function sourceLabel(utm: string | null, leadSource: string | null, bridge: boolean): string {
  const u = (utm ?? "").toLowerCase().trim();
  if (u) {
    if (/instagram|^ig$/.test(u)) return "Instagram";
    if (/substack/.test(u)) return "Substack";
    if (/kit|convertkit|newsletter|^email$/.test(u)) return "Kit weekly email";
    if (/linkedin/.test(u)) return "LinkedIn";
    if (/google/.test(u)) return "Google";
    if (/facebook|^fb$/.test(u)) return "Facebook";
    if (/youtube/.test(u)) return "YouTube";
    if (/bridge/.test(u)) return "BridgeAthletic";
    if (/smoke/.test(u)) return "Test";
    return u.charAt(0).toUpperCase() + u.slice(1);
  }
  if (bridge) return "BridgeAthletic";
  const s = (leadSource ?? "").toLowerCase();
  if (s === "coaching-application") return "Coaching application";
  if (s === "stripe-purchase") return "Site purchase";
  if (/^https?:\/\//.test(s)) {
    try {
      const host = new URL(s).hostname.replace(/^www\./, "");
      if (/instagram/.test(host)) return "Instagram";
      if (/linkedin/.test(host)) return "LinkedIn";
      if (/substack/.test(host)) return "Substack";
      if (/google/.test(host)) return "Google";
      return host;
    } catch {
      /* fall through */
    }
  }
  return "Not recorded";
}

// ─── Loading ────────────────────────────────────────────────────────────────

type Raw = Record<string, any>;

async function rows(q: ReturnType<typeof sql>): Promise<Raw[]> {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  const r: any = await d.execute(q);
  return (r.rows ?? r) as Raw[];
}

const iso = (v: unknown) => new Date(v as string).toISOString();
const dayOf = (v: string) => v.slice(0, 10);
/** Test addresses and Marin's own never count as leads. */
const skip = (email: unknown) => !email || isTestEmail(String(email)) || (ENV.ownerEmail && String(email) === ENV.ownerEmail.toLowerCase());

/** Every contact with their story and standing. Drafts come from contact_followups. */
export async function loadFollowups(now = new Date()): Promise<{ leads: FollowupLead[]; events: StoryEvent[] }> {
  const [leadRows, progress, reports, apps, mails, convo, drafts] = await Promise.all([
    rows(sql`SELECT id, lower(email) AS email, name, source, message, status, product, paid_at, last_contacted_at, created_at FROM leads ORDER BY created_at ASC`),
    rows(sql`SELECT lower(email) AS email, name, answers, completed, utm_source, created_at FROM assessment_progress ORDER BY created_at ASC`),
    rows(sql`SELECT lower(email) AS email, name, answers, scores, utm_source, created_at FROM assessment_reports ORDER BY created_at ASC`),
    rows(sql`SELECT lower(email) AS email, name, q1_90day_goal, utm_source, created_at FROM applications ORDER BY created_at ASC`),
    rows(sql`SELECT lower(to_email) AS email, kind, subject, created_at FROM email_log WHERE status = 'sent' AND kind NOT LIKE 'owner_%' ORDER BY created_at ASC`),
    rows(sql`SELECT id, lower(email) AS email, kind, channel, at, subject, snippet, origin, promise FROM ${conversationEvents} ORDER BY at ASC`),
    rows(sql`SELECT * FROM ${contactFollowups}`),
  ]);

  type Acc = {
    email: string;
    leadId: number | null;
    name: string | null;
    firstSeen: string | null;
    leadSource: string | null;
    utm: string | null;
    status: string;
    product: string | null;
    answers: Record<string, unknown>;
    answersAt: string | null;
    goalFromApp: string | null;
    events: StoryEvent[];
    bridge: boolean;
    formDays: Set<string>;
  };
  const acc = new Map<string, Acc>();
  const get = (email: string): Acc => {
    let a = acc.get(email);
    if (!a) {
      a = { email, leadId: null, name: null, firstSeen: null, leadSource: null, utm: null, status: "new", product: null, answers: {}, answersAt: null, goalFromApp: null, events: [], bridge: false, formDays: new Set() };
      acc.set(email, a);
    }
    return a;
  };
  const earlier = (a: string | null, b: string) => (!a || b < a ? b : a);
  const takeAnswers = (a: Acc, answers: Record<string, unknown>, at: string) => {
    if (!Object.keys(answers).length) return;
    if (!a.answersAt || at >= a.answersAt) {
      a.answers = { ...a.answers, ...answers };
      a.answersAt = at;
    }
  };
  const addForm = (a: Acc, at: string, subject: string) => {
    const day = dayOf(at);
    if (a.formDays.has(day)) return;
    a.formDays.add(day);
    a.events.push({ id: `form:${a.email}:${day}`, email: a.email, kind: "form", channel: "site", at, subject, snippet: null, origin: "site" });
  };

  for (const r of leadRows) {
    if (skip(r.email)) continue;
    const a = get(r.email);
    const at = iso(r.created_at);
    a.leadId = a.leadId ?? Number(r.id);
    if (r.name && !a.name) a.name = String(r.name);
    a.firstSeen = earlier(a.firstSeen, at);
    const kind = leadKind(r.source);
    if (!a.leadSource || kind !== "enquiry") a.leadSource = r.source ?? a.leadSource;
    if (r.status && r.status !== "new") a.status = String(r.status);
    if (r.product) a.product = String(r.product);
    if (kind === "assessment") {
      takeAnswers(a, answersFromMessage(r.message), at);
      addForm(a, at, "Assessment");
    } else if (kind === "enquiry") {
      a.events.push({ id: `enquiry:${r.id}`, email: a.email, kind: "form", channel: "site", at, subject: "Enquiry", snippet: r.message ? String(r.message).slice(0, 400) : null, origin: "site" });
    }
    if (r.paid_at) a.events.push({ id: `purchase:${r.id}`, email: a.email, kind: "purchase", channel: "site", at: iso(r.paid_at), subject: r.product ? `Bought ${r.product}` : "Purchase", snippet: null, origin: "site" });
    if (r.last_contacted_at) a.events.push({ id: `contacted:${r.id}`, email: a.email, kind: "sent", channel: "note", at: iso(r.last_contacted_at), subject: "Marked as contacted", snippet: null, origin: "manual" });
  }
  for (const r of progress) {
    if (skip(r.email)) continue;
    const a = get(r.email);
    const at = iso(r.created_at);
    if (r.name && !a.name) a.name = String(r.name);
    a.firstSeen = earlier(a.firstSeen, at);
    a.utm = a.utm ?? (r.utm_source ? String(r.utm_source) : null);
    takeAnswers(a, parseAnswers(r.answers), at);
    if (r.completed || Object.keys(parseAnswers(r.answers)).length > 2) addForm(a, at, "Assessment");
  }
  for (const r of reports) {
    if (skip(r.email)) continue;
    const a = get(r.email);
    const at = iso(r.created_at);
    if (r.name && !a.name) a.name = String(r.name);
    a.firstSeen = earlier(a.firstSeen, at);
    a.utm = a.utm ?? (r.utm_source ? String(r.utm_source) : null);
    takeAnswers(a, (r.answers ?? {}) as Record<string, unknown>, at);
    addForm(a, at, "Assessment");
  }
  for (const r of apps) {
    if (skip(r.email)) continue;
    const a = get(r.email);
    const at = iso(r.created_at);
    if (r.name && !a.name) a.name = String(r.name);
    a.firstSeen = earlier(a.firstSeen, at);
    a.utm = a.utm ?? (r.utm_source ? String(r.utm_source) : null);
    a.goalFromApp = a.goalFromApp ?? (r.q1_90day_goal ? String(r.q1_90day_goal) : null);
    a.events.push({ id: `application:${at}`, email: a.email, kind: "application", channel: "site", at, subject: "Applied for coaching", snippet: r.q1_90day_goal ? String(r.q1_90day_goal).slice(0, 400) : null, origin: "site" });
  }
  for (const r of mails) {
    if (!r.email || !acc.has(r.email)) continue;
    const a = get(r.email);
    a.events.push({ id: `mail:${r.created_at}:${r.kind}`, email: a.email, kind: "auto", channel: "site", at: iso(r.created_at), subject: EMAIL_KIND_LABELS[r.kind as EmailKind] ?? String(r.subject ?? ""), snippet: null, origin: "site" });
  }
  for (const r of convo) {
    if (skip(r.email)) continue;
    const a = get(r.email);
    if (!a.firstSeen) a.firstSeen = iso(r.at);
    const kind = String(r.kind) as EventKind;
    if (kind === "purchase" && r.origin === "gmail") a.bridge = true;
    a.events.push({ id: `c:${r.id}`, email: a.email, kind, channel: String(r.channel ?? "email"), at: iso(r.at), subject: r.subject ?? null, snippet: r.snippet ?? null, origin: String(r.origin), promise: Boolean(r.promise) });
  }

  const draftByEmail = new Map(drafts.map(r => [String(r.email), r]));
  const leadsOut: FollowupLead[] = [];
  const eventsOut: StoryEvent[] = [];
  for (const a of Array.from(acc.values())) {
    if (!a.events.length) continue;
    a.events.sort((x: StoryEvent, y: StoryEvent) => x.at.localeCompare(y.at));
    const commitmentValue = typeof a.answers.commitment === "string" ? (a.answers.commitment as string) : null;
    const st = standing(a.events, commitmentValue, now);
    const scores = summariseScores(a.answers);
    const role = typeof a.answers.occupation === "string" ? ROLE[a.answers.occupation as string] ?? answerLabel(a.answers, "occupation") : null;
    const goalParts = [answerLabel(a.answers, "primary-goal"), answerLabel(a.answers, "goals-detail")].filter(Boolean);
    const goal = goalParts.length ? goalParts.join(". ") : a.goalFromApp;
    const injuryParts = [answerLabel(a.answers, "current-injuries"), answerLabel(a.answers, "injury-detail")].filter(Boolean);
    const name = (a.name ?? a.email.split("@")[0]).trim();
    const d = draftByEmail.get(a.email);
    const history = describeHistory(a.events);
    leadsOut.push({
      email: a.email,
      leadId: a.leadId,
      name,
      firstName: name.split(/\s+/)[0],
      role,
      source: sourceLabel(a.utm, a.leadSource, a.bridge),
      firstSeen: a.firstSeen ?? a.events[0].at,
      goal,
      commitment: commitmentValue ? COMMITMENT[commitmentValue] ?? humanise(commitmentValue) : "Not recorded",
      commitmentValue,
      injuries: injuryParts.length ? injuryParts.join(". ") : null,
      score: scores?.score ?? null,
      weakest: scores?.weakest ?? null,
      strongest: scores?.strongest ?? null,
      status: a.status,
      product: a.product,
      stage: st.stage,
      priority: st.priority,
      sent: st.sent,
      replies: st.replies,
      lastContact: st.lastContact,
      lastBy: st.lastBy,
      waitingSince: st.waitingSince,
      days: st.days,
      won: st.won,
      promised: st.promised,
      needsDraft: st.needsDraft,
      nextAction: st.needsDraft ? (d?.next_action ? String(d.next_action) : null) : st.nextActionFixed,
      draftSubject: st.needsDraft && d?.draft_subject ? String(d.draft_subject) : null,
      draftBody: st.needsDraft && d?.draft_body ? String(d.draft_body) : null,
      draftedAt: d?.drafted_at ? iso(d.drafted_at) : null,
      history,
    });
    eventsOut.push(...a.events);
  }
  leadsOut.sort((x, y) => STAGES.indexOf(x.stage) - STAGES.indexOf(y.stage) || y.days - x.days);
  return { leads: leadsOut, events: eventsOut };
}

const fmtDay = (isoDate: string) => new Date(isoDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Sydney" });

function describeHistory(events: StoryEvent[]): string {
  const parts: string[] = [];
  for (const e of events) {
    const when = fmtDay(e.at);
    if (e.kind === "form") parts.push(`${e.subject === "Enquiry" ? "Sent an enquiry" : "Filled in the assessment"} on ${when}${e.snippet ? ` ("${e.snippet.slice(0, 120)}")` : ""}`);
    else if (e.kind === "application") parts.push(`Applied for coaching on ${when}`);
    else if (e.kind === "purchase") parts.push(`${e.subject ?? "Bought"} on ${when}`);
    else if (e.kind === "sent") parts.push((e.channel === "call" ? `You called on ${when}` : e.channel === "message" ? `You messaged on ${when}` : `You emailed on ${when}${e.subject ? ` (${e.subject})` : ""}`) + (e.promise ? " and said you would come back to them" : ""));
    else if (e.kind === "reply") parts.push(`They replied on ${when}${e.snippet ? `: "${e.snippet.slice(0, 160)}"` : ""}`);
    else if (e.kind === "auto") parts.push(`${e.subject ?? "Automated email"} sent on ${when}`);
  }
  return parts.join(". ") + (parts.length ? "." : "");
}

// ─── Drafting ───────────────────────────────────────────────────────────────

/** Marin's copy rule: no dashes of any kind. */
export function noDashes(s: string): string {
  return s
    .replace(/[‒–—―]/g, ", ")
    .replace(/(\d)\s*-\s*(\d)/g, "$1 to $2")
    .replace(/\s+-\s+/g, ", ")
    .replace(/-/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/ {2,}/g, " ");
}

function basisFor(l: FollowupLead): string {
  return createHash("sha256").update([l.stage, l.waitingSince, l.sent, l.replies, l.commitmentValue, l.score, l.history.slice(-400)].join("|")).digest("hex").slice(0, 40);
}

const SYSTEM_PROMPT = `You draft short personal emails for Marin Lazic, a strength and conditioning coach in Sydney. He coaches the Australian men's water polo team and busy professionals, and he writes like he talks: plain, warm, direct, short sentences. No sales talk, no exclamation marks, no bullet points, no emojis, no headings. Australian spelling.
Hard rule: never use a hyphen or a dash anywhere, not even inside words. Write "pre season", "chin ups", "3 to 4", "one to one".
Length: two to five short sentences, then one clear question, then "Marin" on its own line. Use the person's first name once at the start. Do not repeat their assessment back to them; pick one thing and make it useful.
Answer only with JSON of this shape and nothing else:
{"next_action": "one sentence for Marin's own eyes on what this email does and why", "subject": "short subject, no dashes", "body": "the email"}`;

type Draft = { next_action: string; subject: string; body: string };

function stageBrief(l: FollowupLead): string {
  const last = l.history;
  switch (l.stage) {
    case "Reply owed":
      return l.promised
        ? `Marin told them he would come back to them and has not, ${l.days} days ago. Deliver on that promise now (or give a firm date), briefly own the gap in one line, and propose the next step.`
        : `They wrote last and have been waiting ${l.days} days for Marin. Answer what they raised, keep it moving, and propose the next step (a short call, or starting).`;
    case "Never replied":
      return `They filled in the assessment ${l.days} days ago and have not had a personal email from Marin yet. Open with one specific observation from their assessment, give one practical thing to try this week, and ask one question about their goal. If it has been more than a week, one short line acknowledging the delay at most.`;
    case "Won":
      return l.days > 30
        ? `They bought${l.product ? ` ${l.product}` : ""} ${l.days} days ago and never had a personal note from Marin. A short, honest check in on how the program went and what they are doing now. One line owning the silence at most, then forward.`
        : `They bought${l.product ? ` ${l.product}` : ""} and have not had a welcome from Marin yet. Welcome them, tell them the program is in Bridge Athletic and to say if it does not show, and ask one question that helps Marin coach them.`;
    case "Waiting on lead":
      return `Marin emailed and they have not replied for ${l.days} days. A short nudge that adds one new useful thought. No pressure, no guilt.`;
    default:
      return last;
  }
}

async function draftFor(l: FollowupLead): Promise<Draft> {
  const facts = [
    `Stage: ${l.stage}. ${stageBrief(l)}`,
    `Name: ${l.name} (first name ${l.firstName})`,
    l.role ? `Role: ${l.role}` : null,
    l.goal ? `Goal in their words: ${l.goal}` : null,
    `Commitment on the form: ${l.commitment}`,
    l.injuries ? `Injuries: ${l.injuries}` : null,
    l.score !== null ? `Assessment score ${l.score} out of 100. Weakest area: ${l.weakest}. Strongest area: ${l.strongest}.` : "No assessment answers on file.",
    `What has happened so far: ${l.history}`,
    `Source: ${l.source}`,
  ].filter(Boolean);
  const result = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: facts.join("\n") },
    ],
  });
  const content = result.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : Array.isArray(content) ? content.map((c: any) => (c.type === "text" ? c.text : "")).join("") : "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Draft was not JSON");
  const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<Draft>;
  if (!parsed.body || !parsed.subject) throw new Error("Draft missing subject or body");
  return {
    next_action: noDashes(String(parsed.next_action ?? "").trim()),
    subject: noDashes(String(parsed.subject).trim()).slice(0, 300),
    body: noDashes(String(parsed.body).trim()),
  };
}

export type RefreshResult = { leads: number; drafted: number; kept: number; failed: number; skipped: number; errors: string[] };

/**
 * Writes or rewrites the draft for every lead whose story changed. `only`
 * limits it to one address (the Redraft button). Without a Gemini key the
 * standing still updates and the drafts stay empty.
 */
export async function refreshFollowups(options: { only?: string; force?: boolean; limit?: number } = {}): Promise<RefreshResult> {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  const { leads: all } = await loadFollowups();
  const existing = new Map(
    (await rows(sql`SELECT email, basis, stage, priority FROM ${contactFollowups}`)).map(r => [String(r.email), r])
  );
  const out: RefreshResult = { leads: all.length, drafted: 0, kept: 0, failed: 0, skipped: 0, errors: [] };
  const limit = options.limit ?? 25;
  const upsert = async (email: string, set: Partial<typeof contactFollowups.$inferInsert>) => {
    const values = { email, stage: set.stage ?? "Never replied", priority: set.priority ?? "Low", ...set };
    await d.insert(contactFollowups).values(values).onConflictDoUpdate({ target: contactFollowups.email, set });
  };

  const toDraft: FollowupLead[] = [];
  for (const l of all) {
    if (options.only && l.email !== options.only) continue;
    const basis = basisFor(l);
    const prev = existing.get(l.email);
    const standingOnly = { stage: l.stage, priority: l.priority, updatedAt: new Date() };
    if (!l.needsDraft) {
      await upsert(l.email, { ...standingOnly, nextAction: null, draftSubject: null, draftBody: null, basis, draftedAt: null });
      out.skipped++;
      continue;
    }
    if (!options.force && prev && prev.basis === basis && l.draftBody) {
      out.kept++;
      continue;
    }
    if (!ENV.geminiApiKey || toDraft.length >= limit) {
      await upsert(l.email, { ...standingOnly, basis: prev?.basis === basis ? basis : null });
      out.skipped++;
      continue;
    }
    toDraft.push(l);
  }

  // Three at a time: a full run of forty takes a couple of minutes instead of ten.
  // A used up Gemini quota stops the run, so drafts never eat the allowance
  // the assessment reports need.
  let i = 0;
  let quotaGone = false;
  await Promise.all(
    Array.from({ length: Math.min(3, toDraft.length) }, async () => {
      while (i < toDraft.length && !quotaGone) {
        const l = toDraft[i++];
        const standingOnly = { stage: l.stage, priority: l.priority, updatedAt: new Date() };
        try {
          const draft = await draftFor(l);
          await upsert(l.email, { ...standingOnly, nextAction: draft.next_action, draftSubject: draft.subject, draftBody: draft.body, basis: basisFor(l), draftedAt: new Date() });
          out.drafted++;
        } catch (err) {
          const raw = String((err as Error)?.message ?? err);
          const quota = /exceeded your current quota/i.test(raw);
          const msg = quota ? QUOTA_MESSAGE : raw.slice(0, 200);
          console.warn("[Followup] Draft failed for a contact:", msg);
          if (!out.errors.includes(msg) && out.errors.length < 5) out.errors.push(msg);
          await upsert(l.email, standingOnly);
          out.failed++;
          if (quota) quotaGone = true;
        }
      }
    })
  );
  if (quotaGone) out.skipped += toDraft.length - i;
  return out;
}

export const QUOTA_MESSAGE = "Gemini says the key's quota is used up (the free tier's daily allowance). Drafts resume when it resets, or straight away once billing is enabled on the key in Google AI Studio.";

// ─── Manual events and the one off import ───────────────────────────────────

export async function logContact(input: { email: string; kind: "sent" | "reply"; channel: "email" | "call" | "message"; at?: string; note?: string; promise?: boolean }): Promise<void> {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  const email = input.email.toLowerCase();
  await d.insert(conversationEvents).values({
    email,
    kind: input.kind,
    channel: input.channel,
    at: input.at ? new Date(input.at) : new Date(),
    subject: input.note?.slice(0, 300) ?? (input.promise ? "Said I would come back to them" : input.channel === "call" ? "Call" : input.channel === "message" ? "Message" : null),
    snippet: null,
    origin: "manual",
    promise: Boolean(input.promise && input.kind === "sent"),
    externalId: null,
    threadId: null,
  });
  if (input.kind === "sent") {
    await d.update(leads).set({ lastContactedAt: new Date(), status: sql`CASE WHEN ${leads.status} = 'new' THEN 'contacted'::lead_status ELSE ${leads.status} END` }).where(sql`lower(${leads.email}) = ${email}`);
  }
}

export async function importEvents(rowsIn: { email: string; kind: "sent" | "reply" | "purchase" | "auto"; at: string; subject?: string; promise?: boolean }[]): Promise<number> {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  const values = rowsIn
    .filter(r => r.email && !isTestEmail(r.email))
    .map(r => ({
      email: r.email.toLowerCase(),
      kind: r.kind,
      channel: "email",
      at: new Date(r.at),
      subject: r.subject?.slice(0, 300) ?? null,
      snippet: null,
      origin: "import",
      promise: Boolean(r.promise && r.kind === "sent"),
      externalId: `${r.email.toLowerCase()}:${r.kind}:${r.at}`,
      threadId: null,
    }));
  for (let i = 0; i < values.length; i += 200) {
    await d.insert(conversationEvents).values(values.slice(i, i + 200)).onConflictDoNothing();
  }
  return values.length;
}
