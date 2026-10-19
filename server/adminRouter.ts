// Dashboard API for /admin. Everything here is behind adminProcedure.
// Numbers come from the site's own tables: analytics_events (page views and
// clicks), leads, applications, assessment_progress, assessment_reports.
import { z } from "zod";
import { and, desc, eq, gte, ilike, inArray, isNotNull, lt, or, sql } from "drizzle-orm";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  analyticsEvents,
  applications,
  assessmentProgress,
  assessmentReports,
  leadNotes,
  leads,
} from "../drizzle/schema";
import { kitOverview } from "./kitStats";
import { EMAIL_KIND_LABELS } from "./emailLog";
import { QUESTIONS, calculateScores, getScoreBand, getScoreLabel } from "../shared/assessment";
import { runDiagnostics } from "./diagnostics";
import { answersFromMessage, labelAnswer, leadKind, parseAnswers } from "./contactAnswers";
import { importEvents, loadFollowups, logContact, refreshFollowups } from "./followup";
import { disconnect as gmailDisconnect, gmailStatus, recordSyncError, syncGmail } from "./gmail";

export { answersFromMessage, labelAnswer, leadKind };

// ─── Helpers ───────────────────────────────────────────────────────────────

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

type Row = Record<string, unknown>;
async function raw<T extends Row = Row>(query: ReturnType<typeof sql>): Promise<T[]> {
  const d = await db();
  const res: any = await d.execute(query);
  return (res.rows ?? res) as T[];
}

const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function windows(days: number) {
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);
  const previousSince = new Date(since.getTime() - days * 86_400_000);
  return { now, since, previousSince };
}

function dayKeys(since: Date, now: Date): string[] {
  const keys: string[] = [];
  const d = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate()));
  while (d <= now) {
    keys.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return keys;
}

const ENQUIRY_EXCLUDED_SOURCES = ["coaching-application", "stripe-purchase"];
const enquiryWhere = sql`(${leads.source} IS NULL OR (${leads.source} NOT LIKE 'performance-assessment%' AND ${leads.source} NOT IN (${sql.join(ENQUIRY_EXCLUDED_SOURCES.map(s => sql`${s}`), sql`, `)})))`;

// event_data is JSON written by the site's tracker. Guard the cast so one odd
// row can never break a whole query.
const EV_JSON = sql`CASE WHEN ${analyticsEvents.eventData} LIKE '{%' THEN ${analyticsEvents.eventData}::jsonb ELSE '{}'::jsonb END`;

function scoreFromAnswers(text: string | null): number | null {
  const answers = parseAnswers(text);
  if (!Object.keys(answers).length) return null;
  const s = calculateScores(answers);
  return s.categories.some(c => c.max > 0) ? s.overallPct : null;
}

// ─── Overview ──────────────────────────────────────────────────────────────

async function countEvents(type: string, since: Date, until?: Date, distinctSessions = false) {
  const where = until
    ? and(eq(analyticsEvents.eventType, type), gte(analyticsEvents.createdAt, since), lt(analyticsEvents.createdAt, until))
    : and(eq(analyticsEvents.eventType, type), gte(analyticsEvents.createdAt, since));
  const d = await db();
  const [row] = await d
    .select({
      c: distinctSessions
        ? sql<number>`count(distinct ${analyticsEvents.sessionId})`
        : sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(where);
  return n(row?.c);
}

async function countTable(table: any, col: any, since: Date, until?: Date, extra?: any) {
  const d = await db();
  const parts = [gte(col, since)];
  if (until) parts.push(lt(col, until));
  if (extra) parts.push(extra);
  const [row] = await d.select({ c: sql<number>`count(*)` }).from(table).where(and(...parts));
  return n(row?.c);
}

async function overview(days: number) {
  const { now, since, previousSince } = windows(days);
  const d = await db();

  const kpi = async (fn: (s: Date, u?: Date) => Promise<number>) => ({
    current: await fn(since),
    previous: await fn(previousSince, since),
  });

  const [visitors, pageViews, assessmentsStarted, assessmentsCompleted, enquiries, applicationsCount, purchases] =
    await Promise.all([
      kpi((s, u) => countEvents("page_view", s, u, true)),
      kpi((s, u) => countEvents("page_view", s, u)),
      kpi((s, u) => countTable(assessmentProgress, assessmentProgress.createdAt, s, u)),
      kpi((s, u) => countTable(assessmentProgress, assessmentProgress.createdAt, s, u, eq(assessmentProgress.completed, true))),
      kpi((s, u) => countTable(leads, leads.createdAt, s, u, enquiryWhere)),
      kpi((s, u) => countTable(applications, applications.createdAt, s, u)),
      kpi((s, u) => countTable(leads, leads.paidAt, s, u)),
    ]);

  const revenue = async (s: Date, u?: Date) => {
    const parts = [gte(leads.paidAt, s)];
    if (u) parts.push(lt(leads.paidAt, u));
    const [row] = await d.select({ c: sql<number>`coalesce(sum(${leads.amountCents}), 0)` }).from(leads).where(and(...parts));
    return n(row?.c);
  };
  const revenueCents = { current: await revenue(since), previous: await revenue(previousSince, since) };

  // Daily series
  const dayCol = sql<string>`to_char(${analyticsEvents.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const dailyViews = await d
    .select({
      date: dayCol.as("date"),
      pageViews: sql<number>`count(*)`,
      visitors: sql<number>`count(distinct ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, since)))
    .groupBy(dayCol);
  const leadDay = sql<string>`to_char(${leads.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const dailyLeads = await d
    .select({ date: leadDay.as("date"), c: sql<number>`count(*)` })
    .from(leads)
    .where(gte(leads.createdAt, since))
    .groupBy(leadDay);
  const progDay = sql<string>`to_char(${assessmentProgress.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const dailyAssessments = await d
    .select({
      date: progDay.as("date"),
      started: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${assessmentProgress.completed})`,
    })
    .from(assessmentProgress)
    .where(gte(assessmentProgress.createdAt, since))
    .groupBy(progDay);

  const byDate = <T extends { date: string }>(rows: T[]) => new Map(rows.map(r => [r.date, r]));
  const v = byDate(dailyViews);
  const l = byDate(dailyLeads);
  const a = byDate(dailyAssessments);
  const daily = dayKeys(since, now).map(date => ({
    date,
    visitors: n(v.get(date)?.visitors),
    pageViews: n(v.get(date)?.pageViews),
    leads: n(l.get(date)?.c),
    assessmentsStarted: n(a.get(date)?.started),
    assessmentsCompleted: n(a.get(date)?.completed),
  }));

  // Funnel, all sessions in the window
  const assessmentPageSessions = await raw<{ c: number }>(sql`
    select count(distinct ${analyticsEvents.sessionId}) as c from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
      and (${EV_JSON} ->> 'path') = '/assessment'`);
  const checkoutStarted = await countEvents("checkout_started", since);
  const funnel = [
    { step: "visitors", label: "Visitors", count: visitors.current },
    { step: "assessment_page", label: "Viewed assessment", count: n(assessmentPageSessions[0]?.c) },
    { step: "assessment_started", label: "Started assessment", count: assessmentsStarted.current },
    { step: "assessment_completed", label: "Finished assessment", count: assessmentsCompleted.current },
    { step: "applied", label: "Applied for coaching", count: applicationsCount.current },
    { step: "checkout", label: "Started checkout", count: checkoutStarted },
    { step: "purchased", label: "Purchased", count: purchases.current },
  ];

  // Follow ups due within 7 days or overdue
  const soon = new Date(now.getTime() + 7 * 86_400_000);
  const followUps = (
    await raw<{ id: number; name: string | null; email: string; status: string; follow_up_at: string }>(sql`
      select * from (
        select distinct on (lower(email)) id, name, email, status, follow_up_at from ${leads}
        where follow_up_at is not null and follow_up_at < ${soon} and status <> 'archived'
        order by lower(email), follow_up_at asc
      ) f order by follow_up_at asc limit 20`)
  ).map(f => ({ id: Number(f.id), name: f.name, email: f.email, status: f.status, followUpAt: new Date(f.follow_up_at) }));

  // Recent activity across tables
  const recent = await raw<{ kind: string; name: string | null; email: string; detail: string | null; at: string; lead_id: number | null }>(sql`
    select * from (
      select 'lead' as kind, l.name, l.email, l.source as detail, l.created_at as at, l.id as lead_id from ${leads} l
        where coalesce(l.source, '') not like 'performance-assessment%' and coalesce(l.source, '') not in ('coaching-application', 'stripe-purchase')
      union all
      select 'application', a.name, a.email, a.q1_90day_goal, a.created_at, null from ${applications} a
      union all
      select case when p.completed then 'assessment_completed' else 'assessment_started' end, p.name, p.email,
        (p.answered_count::text || '/' || p.total_questions::text), coalesce(p.last_activity_at, p.created_at), null
        from ${assessmentProgress} p
      union all
      select 'purchase', l.name, l.email, l.product, l.paid_at, l.id from ${leads} l where l.paid_at is not null
    ) x order by at desc nulls last limit 25`);

  return {
    period: { days, since: since.toISOString(), now: now.toISOString() },
    kpis: { visitors, pageViews, assessmentsStarted, assessmentsCompleted, enquiries, applications: applicationsCount, purchases, revenueCents },
    daily,
    funnel,
    followUps,
    recent: recent.map(r => ({ ...r, at: r.at ? new Date(r.at).toISOString() : null })),
  };
}

// ─── Content and traffic ───────────────────────────────────────────────────

async function content(days: number) {
  const { since } = windows(days);
  const pages = await raw<{ path: string; views: number; visitors: number }>(sql`
    select coalesce(${EV_JSON} ->> 'path', '/') as path, count(*) as views, count(distinct ${analyticsEvents.sessionId}) as visitors
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
    group by 1 order by views desc limit 100`);
  const landing = await raw<{ path: string; sessions: number }>(sql`
    select coalesce(${EV_JSON} ->> 'landingPath', '/') as path, count(distinct ${analyticsEvents.sessionId}) as sessions
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
    group by 1 order by sessions desc limit 30`);
  const ctaClicks = await raw<{ button: string; clicks: number; path: string }>(sql`
    select coalesce(${EV_JSON} ->> 'button', 'unknown') as button, coalesce(${EV_JSON} ->> 'path', '/') as path, count(*) as clicks
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'cta_click' and ${analyticsEvents.createdAt} >= ${since}
    group by 1, 2 order by clicks desc limit 50`);
  const sections = await raw<{ section: string; views: number }>(sql`
    select coalesce(${EV_JSON} ->> 'section', 'unknown') as section, count(*) as views
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'section_view' and ${analyticsEvents.createdAt} >= ${since}
    group by 1 order by views desc limit 30`);
  const shares = await raw<{ platform: string; clicks: number }>(sql`
    select coalesce(${EV_JSON} ->> 'platform', 'unknown') as platform, count(*) as clicks
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'share_click' and ${analyticsEvents.createdAt} >= ${since}
    group by 1 order by clicks desc`);
  const num = <T extends Row>(rows: T[], keys: string[]) =>
    rows.map(r => {
      const out: Row = { ...r };
      for (const k of keys) out[k] = n(r[k]);
      return out as T;
    });
  return {
    pages: num(pages, ["views", "visitors"]),
    landing: num(landing, ["sessions"]),
    ctaClicks: num(ctaClicks, ["clicks"]),
    sections: num(sections, ["views"]),
    shares: num(shares, ["clicks"]),
  };
}

function deviceFromUa(ua: string | null): "mobile" | "tablet" | "desktop" | "bot" | "unknown" {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (/bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse/.test(s)) return "bot";
  if (/ipad|tablet/.test(s)) return "tablet";
  if (/mobile|iphone|android/.test(s)) return "mobile";
  return "desktop";
}

async function traffic(days: number) {
  const { since, now } = windows(days);
  const referrers = await raw<{ referrer: string; sessions: number }>(sql`
    select case when coalesce(${analyticsEvents.referrer}, '') = '' then 'direct'
                else regexp_replace(${analyticsEvents.referrer}, '^https?://([^/]+).*$', '\\1') end as referrer,
           count(distinct ${analyticsEvents.sessionId}) as sessions
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
    group by 1 order by sessions desc limit 30`);
  const utm = async (key: string) =>
    raw<{ value: string; sessions: number }>(sql`
      select ${EV_JSON} ->> ${key} as value, count(distinct ${analyticsEvents.sessionId}) as sessions
      from ${analyticsEvents}
      where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
        and (${EV_JSON} ->> ${key}) is not null
      group by 1 order by sessions desc limit 30`);
  const [sources, mediums, campaigns] = await Promise.all([utm("utm_source"), utm("utm_medium"), utm("utm_campaign")]);
  const agents = await raw<{ ua: string | null; sessions: number }>(sql`
    select ${analyticsEvents.userAgent} as ua, count(distinct ${analyticsEvents.sessionId}) as sessions
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
    group by 1`);
  const devices: Record<string, number> = {};
  for (const row of agents) devices[deviceFromUa(row.ua)] = (devices[deviceFromUa(row.ua)] ?? 0) + n(row.sessions);
  const hourly = await raw<{ hour: number; views: number }>(sql`
    select extract(hour from ${analyticsEvents.createdAt} at time zone 'Australia/Sydney')::int as hour, count(*) as views
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
    group by 1 order by 1`);
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: n(hourly.find(r => Number(r.hour) === h)?.views) }));
  const weekly = await raw<{ dow: number; views: number }>(sql`
    select extract(isodow from ${analyticsEvents.createdAt} at time zone 'Australia/Sydney')::int as dow, count(*) as views
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${analyticsEvents.createdAt} >= ${since}
    group by 1 order by 1`);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
    day: label,
    views: n(weekly.find(r => Number(r.dow) === i + 1)?.views),
  }));
  return {
    period: { since: since.toISOString(), now: now.toISOString() },
    referrers: referrers.map(r => ({ referrer: r.referrer, sessions: n(r.sessions) })),
    utmSources: sources.map(r => ({ value: r.value, sessions: n(r.sessions) })),
    utmMediums: mediums.map(r => ({ value: r.value, sessions: n(r.sessions) })),
    utmCampaigns: campaigns.map(r => ({ value: r.value, sessions: n(r.sessions) })),
    devices,
    hours,
    weekdays,
  };
}

// ─── Contacts ──────────────────────────────────────────────────────────────

const contactSort = z.enum(["newest", "oldest", "name", "score", "followUp", "lastActivity"]);

async function listContacts(input: {
  search?: string;
  status?: string;
  kind?: string;
  sort?: z.infer<typeof contactSort>;
  limit: number;
  offset: number;
}) {
  const d = await db();
  const where: any[] = [];
  if (input.search) {
    const term = `%${input.search.trim()}%`;
    where.push(or(ilike(leads.email, term), ilike(leads.name, term), ilike(leads.message, term)));
  }
  if (input.status) where.push(eq(leads.status, input.status as any));
  if (input.kind === "assessment") where.push(sql`${leads.source} LIKE 'performance-assessment%'`);
  else if (input.kind === "application") where.push(eq(leads.source, "coaching-application"));
  else if (input.kind === "purchase") where.push(isNotNull(leads.paidAt));
  else if (input.kind === "enquiry") where.push(enquiryWhere);
  const filter = where.length ? and(...where) : sql`true`;

  // One row per email address: the most recent lead row stands for the person.
  const orderSql = {
    newest: sql`created_at desc`,
    oldest: sql`created_at asc`,
    name: sql`lower(coalesce(name, email)) asc`,
    score: sql`created_at desc`,
    followUp: sql`follow_up_at asc nulls last, created_at desc`,
    lastActivity: sql`updated_at desc`,
  }[input.sort ?? "newest"];
  const rows = (await raw<typeof leads.$inferSelect & Record<string, unknown>>(sql`
    select * from (
      select distinct on (lower(${leads.email})) * from ${leads} where ${filter}
      order by lower(${leads.email}), ${leads.createdAt} desc
    ) p order by ${orderSql} limit ${input.limit} offset ${input.offset}`)).map(mapLeadRow);
  const [{ total }] = await raw<{ total: number }>(sql`select count(distinct lower(${leads.email})) as total from ${leads} where ${filter}`);

  const emails = Array.from(new Set(rows.map(r => r.email.toLowerCase())));
  const enrich = await enrichByEmail(emails);

  const contacts = rows.map(r => {
    const e = enrich.get(r.email.toLowerCase());
    return {
      ...r,
      kind: leadKind(r.source),
      score: e?.score ?? null,
      reportToken: e?.reportToken ?? null,
      applications: e?.applications ?? 0,
      assessments: e?.assessments ?? 0,
      lastActivityAt: e?.lastActivityAt && e.lastActivityAt > r.updatedAt ? e.lastActivityAt : r.updatedAt,
    };
  });
  if (input.sort === "score") contacts.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return { contacts, total: n(total) };
}

// Raw rows come back with snake_case column names and string timestamps.
function mapLeadRow(r: Record<string, unknown>): typeof leads.$inferSelect {
  const date = (v: unknown) => (v ? new Date(v as string) : null);
  return {
    id: Number(r.id),
    email: String(r.email),
    name: (r.name as string | null) ?? null,
    source: (r.source as string | null) ?? null,
    message: (r.message as string | null) ?? null,
    status: r.status as typeof leads.$inferSelect["status"],
    notes: (r.notes as string | null) ?? null,
    stripeSessionId: (r.stripe_session_id as string | null) ?? null,
    stripePaymentIntent: (r.stripe_payment_intent as string | null) ?? null,
    product: (r.product as string | null) ?? null,
    amountCents: r.amount_cents === null || r.amount_cents === undefined ? null : Number(r.amount_cents),
    currency: (r.currency as string | null) ?? null,
    paidAt: date(r.paid_at),
    followUpAt: date(r.follow_up_at),
    lastContactedAt: date(r.last_contacted_at),
    tags: (r.tags as string[] | null) ?? null,
    createdAt: date(r.created_at) as Date,
    updatedAt: date(r.updated_at) as Date,
  };
}

async function enrichByEmail(emails: string[]) {
  const map = new Map<string, { score: number | null; reportToken: string | null; applications: number; assessments: number; lastActivityAt: Date | null }>();
  if (!emails.length) return map;
  const d = await db();
  const lowerEmail = (col: any) => sql`lower(${col})`;
  const reports = await d
    .select({ email: assessmentReports.email, token: assessmentReports.token, scores: assessmentReports.scores, createdAt: assessmentReports.createdAt })
    .from(assessmentReports)
    .where(inArray(lowerEmail(assessmentReports.email), emails))
    .orderBy(desc(assessmentReports.createdAt));
  const progress = await d
    .select({ email: assessmentProgress.email, answers: assessmentProgress.answers, completed: assessmentProgress.completed, lastActivityAt: assessmentProgress.lastActivityAt })
    .from(assessmentProgress)
    .where(inArray(lowerEmail(assessmentProgress.email), emails))
    .orderBy(desc(assessmentProgress.lastActivityAt));
  const messageLeads = await d
    .select({ email: leads.email, message: leads.message, createdAt: leads.createdAt })
    .from(leads)
    .where(and(inArray(lowerEmail(leads.email), emails), sql`${leads.source} LIKE 'performance-assessment%'`, isNotNull(leads.message)))
    .orderBy(desc(leads.createdAt));
  const apps = await d
    .select({ email: applications.email, c: sql<number>`count(*)`, last: sql<Date>`max(${applications.createdAt})` })
    .from(applications)
    .where(inArray(lowerEmail(applications.email), emails))
    .groupBy(applications.email);

  const get = (email: string) => {
    const key = email.toLowerCase();
    if (!map.has(key)) map.set(key, { score: null, reportToken: null, applications: 0, assessments: 0, lastActivityAt: null });
    return map.get(key)!;
  };
  const later = (a: Date | null, b: Date | null) => (!a ? b : !b ? a : a > b ? a : b);
  for (const r of reports) {
    const e = get(r.email);
    if (e.score === null) {
      e.score = n((r.scores as any)?.overallPct);
      e.reportToken = r.token;
    }
    e.lastActivityAt = later(e.lastActivityAt, r.createdAt);
  }
  for (const p of progress) {
    const e = get(p.email);
    e.assessments += 1;
    if (e.score === null && p.completed) e.score = scoreFromAnswers(p.answers);
    e.lastActivityAt = later(e.lastActivityAt, p.lastActivityAt);
  }
  for (const m of messageLeads) {
    const e = get(m.email);
    if (e.score === null) {
      const answers = answersFromMessage(m.message);
      if (Object.keys(answers).length) {
        const sc = calculateScores(answers);
        if (sc.categories.some(c => c.max > 0)) e.score = sc.overallPct;
      }
    }
  }
  for (const a of apps) {
    const e = get(a.email);
    e.applications = n(a.c);
    e.lastActivityAt = later(e.lastActivityAt, a.last ? new Date(a.last) : null);
  }
  return map;
}

async function contactDetail(id: number) {
  const d = await db();
  const [lead] = await d.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return null;
  const email = lead.email.toLowerCase();
  const emailMatch = (col: any) => sql`lower(${col}) = ${email}`;

  const [notes, otherLeads, apps, progress, reports] = await Promise.all([
    d.select().from(leadNotes).where(eq(leadNotes.leadId, id)).orderBy(desc(leadNotes.createdAt)),
    d.select().from(leads).where(and(emailMatch(leads.email), sql`${leads.id} <> ${id}`)).orderBy(desc(leads.createdAt)),
    d.select().from(applications).where(emailMatch(applications.email)).orderBy(desc(applications.createdAt)),
    d.select().from(assessmentProgress).where(emailMatch(assessmentProgress.email)).orderBy(desc(assessmentProgress.lastActivityAt)),
    d
      .select({ id: assessmentReports.id, token: assessmentReports.token, scores: assessmentReports.scores, createdAt: assessmentReports.createdAt, expiresAt: assessmentReports.expiresAt, pdfKey: assessmentReports.pdfKey, answers: assessmentReports.answers })
      .from(assessmentReports)
      .where(emailMatch(assessmentReports.email))
      .orderBy(desc(assessmentReports.createdAt)),
  ]);

  // Best answer set: latest report, else latest completed progress, else latest progress.
  const latestReport = reports[0];
  const bestProgress = progress.find(p => p.completed) ?? progress[0];
  let answers: Record<string, unknown> = latestReport
    ? (latestReport.answers as Record<string, unknown>)
    : parseAnswers(bestProgress?.answers ?? null);
  if (!latestReport) {
    // Progress answers stop at the last autosave; the lead message has the full set.
    for (const l of [lead, ...otherLeads]) {
      if (leadKind(l.source) !== "assessment") continue;
      const fromMessage = answersFromMessage(l.message);
      if (Object.keys(fromMessage).length) {
        answers = { ...answers, ...fromMessage };
        break;
      }
    }
  }
  const scores = Object.keys(answers).length ? calculateScores(answers) : null;
  const answerList = QUESTIONS.filter(q => q.id !== "name" && q.id !== "email" && answers[q.id] !== undefined && answers[q.id] !== "")
    .map(q => labelAnswer(q.id, answers[q.id]));

  type Item = { at: Date; kind: string; title: string; detail?: string | null };
  const timeline: Item[] = [];
  const push = (at: Date | null | undefined, kind: string, title: string, detail?: string | null) => {
    if (at) timeline.push({ at: new Date(at), kind, title, detail });
  };
  push(lead.createdAt, "lead", `Added as ${leadKind(lead.source)}`, lead.source);
  for (const l of otherLeads) push(l.createdAt, "lead", `Also added as ${leadKind(l.source)}`, l.source);
  for (const p of progress) {
    push(p.createdAt, "assessment", "Started the assessment", `${p.answeredCount ?? 0} of ${p.totalQuestions ?? 0} answered`);
    if (p.completed) push(p.notifiedAt ?? p.lastActivityAt, "assessment", "Finished the assessment", null);
    if (p.reminderSentAt && p.reminderSentAt > new Date("2026-10-16")) push(p.reminderSentAt, "email", "Reminder email sent", null);
  }
  for (const r of reports) push(r.createdAt, "report", "Report generated", `Score ${n((r.scores as any)?.overallPct)}`);
  for (const a of apps) push(a.createdAt, "application", "Applied for coaching", a.q1_90day_goal);
  if (lead.message && leadKind(lead.source) === "enquiry") push(lead.createdAt, "enquiry", "Sent an enquiry", lead.message);
  push(lead.paidAt, "purchase", `Purchased ${lead.product ?? ""}`.trim(), lead.amountCents != null ? `${(lead.amountCents / 100).toFixed(0)} ${(lead.currency ?? "").toUpperCase()}` : null);
  push(lead.lastContactedAt, "contact", "Marked as contacted", null);
  for (const note of notes) push(note.createdAt, "note", "Note", note.body);
  timeline.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    lead: { ...lead, kind: leadKind(lead.source) },
    notes,
    applications: apps,
    progress: progress.map(p => ({ ...p, answers: undefined })),
    reports: reports.map(r => ({ ...r, answers: undefined, scores: r.scores as any })),
    scores,
    scoreLabel: scores ? getScoreLabel(scores.overallPct) : null,
    answers: answerList,
    timeline,
  };
}

// ─── Assessments ───────────────────────────────────────────────────────────

async function assessments(days: number) {
  const { since } = windows(days);
  const d = await db();
  const rows = await d
    .select({ id: assessmentProgress.id, email: assessmentProgress.email, name: assessmentProgress.name, answers: assessmentProgress.answers, completed: assessmentProgress.completed, answeredCount: assessmentProgress.answeredCount, totalQuestions: assessmentProgress.totalQuestions, createdAt: assessmentProgress.createdAt, lastActivityAt: assessmentProgress.lastActivityAt, utmSource: assessmentProgress.utmSource })
    .from(assessmentProgress)
    .where(gte(assessmentProgress.createdAt, since))
    .orderBy(desc(assessmentProgress.createdAt));

  // Progress rows hold the answers saved while the person was mid way. The
  // lead created at submission carries the complete set, so merge it in.
  const assessmentLeads = rows.length
    ? await d
        .select({ email: leads.email, message: leads.message })
        .from(leads)
        .where(and(sql`${leads.source} LIKE 'performance-assessment%'`, inArray(sql`lower(${leads.email})`, Array.from(new Set(rows.map(r => r.email.toLowerCase()))))))
        .orderBy(desc(leads.createdAt))
    : [];
  const fullAnswers = new Map<string, Record<string, unknown>>();
  for (const l of assessmentLeads) {
    const key = l.email.toLowerCase();
    if (fullAnswers.has(key)) continue;
    const a = answersFromMessage(l.message);
    if (Object.keys(a).length) fullAnswers.set(key, a);
  }
  const answersFor = (r: { email: string; answers: string | null; completed: boolean }) => {
    const partial = parseAnswers(r.answers);
    const full = r.completed ? fullAnswers.get(r.email.toLowerCase()) : undefined;
    return full ? { ...partial, ...full } : partial;
  };

  const started = rows.length;
  const completedRows = rows.filter(r => r.completed);
  const scored = completedRows
    .map(r => ({ row: r, answers: answersFor(r) }))
    .filter(x => Object.keys(x.answers).length)
    .map(x => ({ row: x.row, scores: calculateScores(x.answers), answers: x.answers }));

  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const bands: Record<string, number> = { "0-39": 0, "40-49": 0, "50-59": 0, "60-79": 0, "80-100": 0 };
  for (const s of scored) bands[getScoreBand(s.scores.overallPct)] += 1;
  const categoryAverages = (scored[0]?.scores.categories ?? []).map(c => ({
    id: c.id,
    name: c.name,
    average: avg(scored.map(s => s.scores.categories.find(x => x.id === c.id)?.percentage ?? 0)),
  }));

  // Drop off: how many people reached each question (answered it or any later one)
  const order = QUESTIONS.map(q => q.id);
  const reached = order.map(() => 0);
  for (const r of rows) {
    const answers = answersFor(r);
    let lastIdx = -1;
    order.forEach((id, i) => {
      if (answers[id] !== undefined && answers[id] !== "") lastIdx = i;
    });
    if (r.completed) lastIdx = order.length - 1;
    for (let i = 0; i <= lastIdx; i++) reached[i] += 1;
  }
  const dropOff = QUESTIONS.map((q, i) => ({ id: q.id, section: q.section, question: q.text, reached: reached[i] }));

  // Most common answers for the goal and commitment questions
  const tally = (qid: string) => {
    const counts: Record<string, number> = {};
    for (const s of scored) {
      const label = labelAnswer(qid, s.answers[qid]).answer || "No answer";
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  const weakest: Record<string, number> = {};
  for (const s of scored) if (s.scores.weakest) weakest[s.scores.weakest.name] = (weakest[s.scores.weakest.name] ?? 0) + 1;

  return {
    started,
    completed: completedRows.length,
    completionRate: started ? Math.round((completedRows.length / started) * 100) : 0,
    averageScore: avg(scored.map(s => s.scores.overallPct)),
    bands: Object.entries(bands).map(([band, count]) => ({ band, count })),
    categoryAverages,
    weakestAreas: Object.entries(weakest).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    goals: tally("primary-goal"),
    commitment: tally("commitment"),
    occupations: tally("occupation"),
    dropOff,
    recent: rows.slice(0, 30).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      completed: r.completed,
      answeredCount: r.answeredCount ?? 0,
      totalQuestions: r.totalQuestions ?? 0,
      score: r.completed ? (() => { const a = answersFor(r); const sc = calculateScores(a); return sc.categories.some(c => c.max > 0) ? sc.overallPct : null; })() : null,
      createdAt: r.createdAt,
      lastActivityAt: r.lastActivityAt,
      utmSource: r.utmSource,
    })),
  };
}

// ─── System ────────────────────────────────────────────────────────────────

let diagnosticsCache: { at: number; value: Awaited<ReturnType<typeof runDiagnostics>> } | null = null;
async function system(force = false) {
  if (!force && diagnosticsCache && Date.now() - diagnosticsCache.at < 60_000) return diagnosticsCache.value;
  const value = await runDiagnostics();
  diagnosticsCache = { at: Date.now(), value };
  return value;
}

// ─── Email marketing ───────────────────────────────────────────────────────

/** Site emails (Resend) in the period: totals by kind, per day, and the latest sends. */
async function siteEmails(days: number, limit = 100) {
  const { since, previousSince, now } = windows(days);
  const byKind = await raw<{ kind: string; status: string; count: unknown }>(sql`
    SELECT kind, status, COUNT(*) AS count FROM email_log
    WHERE created_at >= ${since} GROUP BY kind, status ORDER BY count DESC`);
  const previous = await raw<{ count: unknown }>(sql`
    SELECT COUNT(*) AS count FROM email_log WHERE created_at >= ${previousSince} AND created_at < ${since} AND status = 'sent'`);
  const daily = await raw<{ day: string; kind: string; count: unknown }>(sql`
    SELECT to_char(created_at AT TIME ZONE 'Australia/Sydney', 'YYYY-MM-DD') AS day, kind, COUNT(*) AS count
    FROM email_log WHERE created_at >= ${since} AND status = 'sent' GROUP BY day, kind ORDER BY day`);
  const recentRows = await raw<{ id: number; to_email: string; kind: string; subject: string; status: string; error: string | null; created_at: string }>(sql`
    SELECT id, to_email, kind, subject, status, error, created_at FROM email_log
    ORDER BY created_at DESC LIMIT ${limit}`);
  const kinds: Record<string, { label: string; sent: number; failed: number }> = {};
  for (const r of byKind) {
    const k = (kinds[r.kind] ??= { label: (EMAIL_KIND_LABELS as Record<string, string>)[r.kind] ?? r.kind, sent: 0, failed: 0 });
    if (r.status === "sent") k.sent += n(r.count); else k.failed += n(r.count);
  }
  const sent = Object.values(kinds).reduce((a, k) => a + k.sent, 0);
  const failed = Object.values(kinds).reduce((a, k) => a + k.failed, 0);
  const keys = dayKeys(since, now);
  const series = keys.map(day => {
    const row: Record<string, number | string> = { day };
    for (const r of daily) if (r.day === day) row[r.kind] = n(r.count);
    return row;
  });
  return {
    days,
    sent,
    failed,
    previousSent: n(previous[0]?.count),
    kinds: Object.entries(kinds).map(([kind, v]) => ({ kind, ...v })).sort((a, b) => b.sent - a.sent),
    series,
    kindLabels: EMAIL_KIND_LABELS,
    recent: recentRows.map(r => ({
      id: r.id,
      to: r.to_email,
      kind: r.kind,
      label: (EMAIL_KIND_LABELS as Record<string, string>)[r.kind] ?? r.kind,
      subject: r.subject,
      status: r.status,
      error: r.error,
      createdAt: r.created_at,
    })),
  };
}

/** Everything a contact received from the site, newest first. */
async function emailsForContact(email: string) {
  const rows = await raw<{ id: number; kind: string; subject: string; status: string; created_at: string }>(sql`
    SELECT id, kind, subject, status, created_at FROM email_log WHERE lower(to_email) = lower(${email}) ORDER BY created_at DESC LIMIT 50`);
  return rows.map(r => ({ id: r.id, kind: r.kind, label: (EMAIL_KIND_LABELS as Record<string, string>)[r.kind] ?? r.kind, subject: r.subject, status: r.status, createdAt: r.created_at }));
}

// ─── Router ────────────────────────────────────────────────────────────────

const daysInput = z.object({ days: z.number().int().min(1).max(365).default(30) }).optional();

export const adminRouter = router({
  overview: adminProcedure.input(daysInput).query(({ input }) => overview(input?.days ?? 30)),
  content: adminProcedure.input(daysInput).query(({ input }) => content(input?.days ?? 30)),
  traffic: adminProcedure.input(daysInput).query(({ input }) => traffic(input?.days ?? 30)),
  assessments: adminProcedure.input(daysInput).query(({ input }) => assessments(input?.days ?? 90)),
  system: adminProcedure.input(z.object({ force: z.boolean().optional() }).optional()).query(({ input }) => system(input?.force)),

  email: router({
    kit: adminProcedure
      .input(z.object({ days: z.number().int().min(1).max(365).default(30), force: z.boolean().optional() }).optional())
      .query(({ input }) => kitOverview(input?.days ?? 30, input?.force)),
    site: adminProcedure.input(daysInput).query(({ input }) => siteEmails(input?.days ?? 30)),
    forContact: adminProcedure.input(z.object({ email: z.string().email() })).query(({ input }) => emailsForContact(input.email)),
  }),

  // Where every lead stands, with the drafted replies. Gmail feeds it once connected.
  followup: router({
    overview: adminProcedure.query(async () => {
      const [{ leads: rows, events }, gmail] = await Promise.all([loadFollowups(), gmailStatus()]);
      return { leads: rows, events, gmail, generatedAt: new Date().toISOString() };
    }),
    // Reads new mail (when Gmail is connected) and rewrites the drafts whose story changed.
    sync: adminProcedure.input(z.object({ full: z.boolean().optional(), redraft: z.boolean().optional() }).optional()).mutation(async ({ input }) => {
      const gmail = await gmailStatus();
      let mail: Awaited<ReturnType<typeof syncGmail>> | null = null;
      let mailError: string | null = null;
      if (gmail.connected) {
        try {
          mail = await syncGmail({ full: input?.full });
        } catch (err) {
          mailError = String((err as Error)?.message ?? err);
          await recordSyncError(err);
        }
      }
      const drafts = await refreshFollowups({ force: input?.redraft, limit: 40 });
      return { mail, mailError, drafts };
    }),
    redraft: adminProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => refreshFollowups({ only: input.email.toLowerCase(), force: true, limit: 1 })),
    // "I replied", "I called", "they replied": for anything that did not go through Gmail.
    log: adminProcedure
      .input(z.object({ email: z.string().email(), kind: z.enum(["sent", "reply"]), channel: z.enum(["email", "call", "message"]).default("email"), at: z.string().optional(), note: z.string().max(300).optional(), promise: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        await logContact(input);
        await refreshFollowups({ only: input.email.toLowerCase(), limit: 1 });
        return { ok: true };
      }),
    importEvents: adminProcedure
      .input(z.object({ rows: z.array(z.object({ email: z.string().email(), kind: z.enum(["sent", "reply", "purchase", "auto"]), at: z.string(), subject: z.string().optional(), promise: z.boolean().optional() })).max(2000) }))
      .mutation(async ({ input }) => ({ imported: await importEvents(input.rows) })),
    gmailDisconnect: adminProcedure.mutation(async () => {
      await gmailDisconnect();
      return { ok: true };
    }),
  }),

  contacts: router({
    list: adminProcedure
      .input(
        z.object({
          search: z.string().max(200).optional(),
          status: z.enum(["new", "contacted", "applied", "converted", "archived"]).optional(),
          kind: z.enum(["assessment", "application", "purchase", "enquiry"]).optional(),
          sort: contactSort.optional(),
          limit: z.number().int().min(1).max(200).default(50),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(({ input }) => listContacts(input)),
    detail: adminProcedure.input(z.object({ id: z.number().int() })).query(({ input }) => contactDetail(input.id)),
    update: adminProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["new", "contacted", "applied", "converted", "archived"]).optional(),
          name: z.string().max(200).optional(),
          followUpAt: z.string().datetime().nullable().optional(),
          lastContactedAt: z.string().datetime().nullable().optional(),
          tags: z.array(z.string().max(40)).max(20).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const d = await db();
        const set: Record<string, unknown> = {};
        if (input.status) {
          set.status = input.status;
          if (input.status === "contacted" && input.lastContactedAt === undefined) set.lastContactedAt = new Date();
        }
        if (input.name !== undefined) set.name = input.name;
        if (input.followUpAt !== undefined) set.followUpAt = input.followUpAt ? new Date(input.followUpAt) : null;
        if (input.lastContactedAt !== undefined) set.lastContactedAt = input.lastContactedAt ? new Date(input.lastContactedAt) : null;
        if (input.tags !== undefined) set.tags = input.tags;
        if (Object.keys(set).length) await d.update(leads).set(set).where(eq(leads.id, input.id));
        return { ok: true };
      }),
    addNote: adminProcedure
      .input(z.object({ id: z.number().int(), body: z.string().min(1).max(5000) }))
      .mutation(async ({ input }) => {
        const d = await db();
        const [note] = await d.insert(leadNotes).values({ leadId: input.id, body: input.body.trim() }).returning();
        return note;
      }),
    deleteNote: adminProcedure
      .input(z.object({ noteId: z.number().int() }))
      .mutation(async ({ input }) => {
        const d = await db();
        await d.delete(leadNotes).where(eq(leadNotes.id, input.noteId));
        return { ok: true };
      }),
  }),

  applications: router({
    list: adminProcedure.query(async () => {
      const d = await db();
      const rows = await d.select().from(applications).orderBy(desc(applications.createdAt));
      const emails = Array.from(new Set(rows.map(r => r.email.toLowerCase())));
      const leadRows = emails.length
        ? await d
            .select({ id: leads.id, email: leads.email, status: leads.status, followUpAt: leads.followUpAt })
            .from(leads)
            .where(inArray(sql`lower(${leads.email})`, emails))
            .orderBy(desc(leads.createdAt))
        : [];
      const leadByEmail = new Map<string, (typeof leadRows)[number]>();
      for (const l of leadRows) if (!leadByEmail.has(l.email.toLowerCase())) leadByEmail.set(l.email.toLowerCase(), l);
      return rows.map(r => {
        let assessment: { score?: number; weakestArea?: string; primaryGoal?: string } | null = null;
        try {
          assessment = r.assessmentData ? JSON.parse(r.assessmentData) : null;
        } catch {
          assessment = null;
        }
        const lead = leadByEmail.get(r.email.toLowerCase());
        return { ...r, assessment, leadId: lead?.id ?? null, status: lead?.status ?? null, followUpAt: lead?.followUpAt ?? null };
      });
    }),
  }),
});
