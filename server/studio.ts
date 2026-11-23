/**
 * The Studio: one idea from Marin becomes the same message shaped for every
 * channel he publishes on, in the site's voice. The rules are the content
 * skill in .claude/skills/content (copied into studioRules.generated.ts at
 * build time). This file writes the core and the pieces with Gemini, cleans
 * the mechanical faults, and records what the style guide still objects to.
 */
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { analyticsEvents, applications, assessmentReports, contentIdeas, contentPieces, contentStats } from "../drizzle/schema";
import { FORMATS, STYLE_GUIDE } from "./studioRules.generated";
import { autoFix, checkText } from "../shared/contentChecks";
import { CHANNELS, CTAS, campaignKey, channelById } from "../shared/studioChannels";
import { HUMAN_EVENT } from "./botFilter";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

// ─── Talking to the model ──────────────────────────────────────────────────

function textOf(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const content = result.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c: any) => (c.type === "text" ? c.text : "")).join("");
  return "";
}

/** The model is asked for JSON. Take the outermost object, fences or not. */
export function parseJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The model did not answer with JSON");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

async function ask<T>(system: string, user: string): Promise<T> {
  const result = await invokeLLM({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    responseFormat: { type: "json_object" },
  });
  return parseJson<T>(textOf(result));
}

const VOICE_PREAMBLE = `You write content for Marin Lazic. You follow his style guide exactly. The style guide:

${STYLE_GUIDE}

Hard rules the checker enforces afterwards, so get them right the first time: no em dashes or en dashes anywhere, no exclamation marks, no emoji, no hashtags, Australian spelling, sentence case for headings and titles, write ranges as "4 to 8". Use only the facts in the style guide and the core. Where a personal story or client example would help and none is on record, write [MARIN: add a real example] and say what kind of example would fit. Never invent research, numbers, client results or quotes.`;

// ─── The core ──────────────────────────────────────────────────────────────

const CORE_INSTRUCTIONS = `Marin gives you an idea. Pin it down before anything is written for a channel. Answer with JSON of this shape and nothing else:
{
  "title": "the idea in one plain sentence, under 80 characters, in Marin's words",
  "slug": "2 to 4 lower case words joined by hyphens",
  "hooks": ["three different first lines, each under 12 words"],
  "core": "markdown, see below"
}
The core markdown has these headings, each a level 2 heading in sentence case, in this order:
## Idea, in one sentence
## The claim (what Marin says is true that the reader may not believe yet)
## Why it is true (the mechanism, two or three plain sentences)
## The proof on record (one fact from Marin's work that is in the style guide; if a story is needed and none is on record, a [MARIN: add a real example] line saying what would fit)
## What the reader should do this week (one action, specific, small enough to do in the worst week)
## The objection (the most likely pushback and the one line answer)
## Call to action (the one destination given, with the wording from the style guide)
## Hooks (the three hooks, numbered, with the default marked and why)
## Facts the pieces may use (five numbered facts, from the style guide and the idea, and nothing else)
If the idea is weak or wrong, say so in one short paragraph at the top of the core under the heading "## A note from the writer", soften the claim to what the evidence supports, and still write everything.`;

export type CoreResult = { title: string; slug: string; hooks: string[]; core: string };

export async function writeCore(idea: string, cta: string): Promise<CoreResult> {
  const c = CTAS[cta] ?? CTAS.assessment;
  const r = await ask<Partial<CoreResult>>(
    `${VOICE_PREAMBLE}\n\n${CORE_INSTRUCTIONS}`,
    `The idea:\n${idea}\n\nThe call to action for every piece: ${c.label}. Wording: ${c.line} Address: marinlazic.com${c.path}`
  );
  if (!r.core || !r.title) throw new Error("The core came back incomplete");
  return {
    title: autoFix(String(r.title)).slice(0, 200),
    slug: String(r.slug ?? r.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "idea",
    hooks: Array.isArray(r.hooks) ? r.hooks.map(h => autoFix(String(h))) : [],
    core: autoFix(String(r.core)),
  };
}

// ─── One piece ─────────────────────────────────────────────────────────────

const PIECE_INSTRUCTIONS = `You are given the core for one idea and the spec for one channel. Write the piece for that channel from the core. Same idea, same claim, same action, same facts. If the channel needs less, cut. Never add a fact that is not in the core.

Written channels get written language. Video channels get spoken language: shorter sentences, contractions, nothing that needs a comma to say, directions in square brackets on their own line.

Answer with JSON of this shape and nothing else:
{
  "title": "the headline, subject or video title the spec asks for, or the first line of the piece",
  "meta": { "key": "value" },
  "body": "markdown, ready to paste"
}
meta holds every field the spec's header block names apart from Channel and Paste into: for example subject, subtitle, preview, description, attach, check, firstComment, shot, cover, thumbnail, slides, segment, source. Keys are lower camel case. Values are plain strings.
body is the content itself and nothing else: no header block, no channel name, no explanation. Where the spec asks for a table (carousel slides, video script) write a markdown table with exactly the columns the spec names. Where the spec asks for several variants (Notes, X posts) label each with a bold line such as **Note 1 (the claim)** and put a blank line between them. For X posts put the character count in brackets on its own line after each post.`;

export type PieceResult = { title: string; meta: Record<string, string>; body: string; checks: { line: number; message: string }[] };

export async function writePiece(core: string, channel: string, direction?: string): Promise<PieceResult> {
  const spec = FORMATS[channel];
  const ch = channelById(channel);
  if (!spec || !ch) throw new Error(`Unknown channel ${channel}`);
  const user = [
    `The channel: ${ch.label}.`,
    `The channel spec:\n${spec}`,
    `The core:\n${core}`,
    direction ? `Marin's direction for this rewrite, which wins over the spec where they differ: ${direction}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
  const r = await ask<Partial<PieceResult>>(`${VOICE_PREAMBLE}\n\n${PIECE_INSTRUCTIONS}`, user);
  if (!r.body) throw new Error("The piece came back without a body");
  const meta: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.meta ?? {})) {
    if (v === null || v === undefined) continue;
    meta[k] = autoFix(typeof v === "string" ? v : JSON.stringify(v)).slice(0, 2000);
  }
  const body = autoFix(String(r.body)).trim();
  return {
    title: autoFix(String(r.title ?? "")).slice(0, 300),
    meta,
    body,
    checks: checkText(body),
  };
}

// ─── Ideas and pieces in the database ──────────────────────────────────────

async function uniqueSlug(base: string): Promise<string> {
  const d = await db();
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const [row] = await d.select({ id: contentIdeas.id }).from(contentIdeas).where(eq(contentIdeas.slug, slug)).limit(1);
    if (!row) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/** Saves the idea, writes the core, and queues one pending piece per channel. */
export async function createIdea(input: { idea: string; cta: string; channels: string[] }) {
  const d = await db();
  const channels = input.channels.filter(c => channelById(c));
  if (!channels.length) throw new Error("Pick at least one channel");
  const core = await writeCore(input.idea, input.cta);
  const slug = await uniqueSlug(core.slug);
  const [idea] = await d
    .insert(contentIdeas)
    .values({ slug, title: core.title, idea: input.idea, core: core.core, cta: input.cta, status: "draft" })
    .returning();
  await d.insert(contentPieces).values(channels.map(channel => ({ ideaId: idea.id, channel, status: "pending" as const })));
  return idea;
}

/** Writes or rewrites one piece from its idea's core. */
export async function generatePiece(pieceId: number, direction?: string) {
  const d = await db();
  const [piece] = await d.select().from(contentPieces).where(eq(contentPieces.id, pieceId)).limit(1);
  if (!piece) throw new Error("Piece not found");
  const [idea] = await d.select().from(contentIdeas).where(eq(contentIdeas.id, piece.ideaId)).limit(1);
  if (!idea?.core) throw new Error("The idea has no core yet");
  await d.update(contentPieces).set({ status: "generating", error: null }).where(eq(contentPieces.id, pieceId));
  try {
    const r = await writePiece(idea.core, piece.channel, direction);
    const [updated] = await d
      .update(contentPieces)
      .set({ title: r.title, meta: r.meta, body: r.body, checks: r.checks, status: "draft", error: null })
      .where(eq(contentPieces.id, pieceId))
      .returning();
    await refreshIdeaStatus(idea.id);
    return updated;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const [updated] = await d.update(contentPieces).set({ status: "failed", error: message }).where(eq(contentPieces.id, pieceId)).returning();
    return updated;
  }
}

/** An idea is ready once every piece has been written. */
async function refreshIdeaStatus(ideaId: number) {
  const d = await db();
  const rows = await d.select({ status: contentPieces.status }).from(contentPieces).where(eq(contentPieces.ideaId, ideaId));
  const open = rows.some(r => r.status === "pending" || r.status === "generating");
  const [idea] = await d.select({ status: contentIdeas.status }).from(contentIdeas).where(eq(contentIdeas.id, ideaId)).limit(1);
  if (idea && idea.status !== "archived") {
    await d.update(contentIdeas).set({ status: open ? "draft" : "ready" }).where(eq(contentIdeas.id, ideaId));
  }
}

export async function updatePiece(input: { id: number; title?: string; body?: string; meta?: Record<string, unknown>; status?: string; url?: string | null; postedAt?: Date | null }) {
  const d = await db();
  const set: Partial<typeof contentPieces.$inferInsert> = {};
  if (input.title !== undefined) set.title = input.title.slice(0, 300);
  if (input.body !== undefined) {
    set.body = input.body;
    set.checks = checkText(input.body);
  }
  if (input.meta !== undefined) set.meta = input.meta;
  if (input.status !== undefined) {
    set.status = input.status;
    if (input.status === "posted" && input.postedAt === undefined) set.postedAt = new Date();
  }
  if (input.url !== undefined) set.url = input.url ? input.url.slice(0, 500) : null;
  if (input.postedAt !== undefined) set.postedAt = input.postedAt;
  const [row] = await d.update(contentPieces).set(set).where(eq(contentPieces.id, input.id)).returning();
  return row;
}

export async function updateIdea(input: { id: number; title?: string; core?: string; cta?: string; status?: string }) {
  const d = await db();
  const set: Partial<typeof contentIdeas.$inferInsert> = {};
  if (input.title !== undefined) set.title = input.title.slice(0, 200);
  if (input.core !== undefined) set.core = input.core;
  if (input.cta !== undefined && CTAS[input.cta]) set.cta = input.cta;
  if (input.status !== undefined) set.status = input.status;
  const [row] = await d.update(contentIdeas).set(set).where(eq(contentIdeas.id, input.id)).returning();
  return row;
}

/** Adds channels that were not part of the first run, as pending pieces. */
export async function addChannels(ideaId: number, channels: string[]) {
  const d = await db();
  const existing = await d.select({ channel: contentPieces.channel }).from(contentPieces).where(eq(contentPieces.ideaId, ideaId));
  const have = new Set(existing.map(e => e.channel));
  const fresh = channels.filter(c => channelById(c) && !have.has(c));
  if (fresh.length) await d.insert(contentPieces).values(fresh.map(channel => ({ ideaId, channel, status: "pending" as const })));
  await refreshIdeaStatus(ideaId);
  return fresh;
}

export async function deleteIdea(id: number) {
  const d = await db();
  await d.delete(contentIdeas).where(eq(contentIdeas.id, id));
}

// ─── Reading ───────────────────────────────────────────────────────────────

export async function listIdeas() {
  const d = await db();
  const ideas = await d.select().from(contentIdeas).orderBy(desc(contentIdeas.createdAt)).limit(200);
  if (!ideas.length) return [];
  const pieces = await d
    .select({ ideaId: contentPieces.ideaId, channel: contentPieces.channel, status: contentPieces.status })
    .from(contentPieces)
    .where(inArray(contentPieces.ideaId, ideas.map(i => i.id)));
  return ideas.map(i => ({
    ...i,
    pieces: pieces.filter(p => p.ideaId === i.id).map(p => ({ channel: p.channel, status: p.status })),
  }));
}

/** The newest reading for each piece. */
async function latestStats(pieceIds: number[]) {
  if (!pieceIds.length) return [] as (typeof contentStats.$inferSelect)[];
  const d = await db();
  const rows = await d
    .select()
    .from(contentStats)
    .where(inArray(contentStats.pieceId, pieceIds))
    .orderBy(desc(contentStats.recordedAt), desc(contentStats.id));
  const seen = new Set<number>();
  return rows.filter(r => (seen.has(r.pieceId) ? false : (seen.add(r.pieceId), true)));
}

/** What the site saw from this idea's tagged links: visits, assessments and applications by source. */
export async function siteResultsFor(slug: string) {
  const d = await db();
  const key = campaignKey(slug);
  const EV = sql`CASE WHEN ${analyticsEvents.eventData} LIKE '{%' THEN ${analyticsEvents.eventData}::jsonb ELSE '{}'::jsonb END`;
  const visits: any = await d.execute(sql`
    select ${EV} ->> 'utm_source' as source, count(distinct ${analyticsEvents.sessionId}) as sessions
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${HUMAN_EVENT} and (${EV} ->> 'utm_campaign') = ${key}
    group by 1`);
  const reports: any = await d.execute(sql`
    select ${assessmentReports.utmSource} as source, count(*) as n from ${assessmentReports}
    where ${assessmentReports.utmCampaign} = ${key} group by 1`);
  const apps: any = await d.execute(sql`
    select ${applications.utmSource} as source, count(*) as n from ${applications}
    where ${applications.utmCampaign} = ${key} group by 1`);
  const bySource: Record<string, { visits: number; assessments: number; applications: number }> = {};
  const bucket = (s: unknown) => (bySource[String(s ?? "unknown")] ??= { visits: 0, assessments: 0, applications: 0 });
  for (const r of visits.rows ?? visits) bucket(r.source).visits += Number(r.sessions);
  for (const r of reports.rows ?? reports) bucket(r.source).assessments += Number(r.n);
  for (const r of apps.rows ?? apps) bucket(r.source).applications += Number(r.n);
  return bySource;
}

export async function getIdea(id: number) {
  const d = await db();
  const [idea] = await d.select().from(contentIdeas).where(eq(contentIdeas.id, id)).limit(1);
  if (!idea) return null;
  const pieces = await d.select().from(contentPieces).where(eq(contentPieces.ideaId, id));
  const order = new Map(CHANNELS.map((c, i) => [c.id, i]));
  pieces.sort((a, b) => (order.get(a.channel) ?? 99) - (order.get(b.channel) ?? 99));
  const stats = await latestStats(pieces.map(p => p.id));
  const site = await siteResultsFor(idea.slug);
  return {
    ...idea,
    pieces: pieces.map(p => ({ ...p, stats: stats.find(s => s.pieceId === p.id) ?? null })),
    site,
  };
}

export async function addStats(input: { pieceId: number; impressions?: number; likes?: number; comments?: number; shares?: number; saves?: number; clicks?: number; followers?: number; subscribers?: number; replies?: number; notes?: string | null; recordedAt?: Date }) {
  const d = await db();
  const [row] = await d
    .insert(contentStats)
    .values({
      pieceId: input.pieceId,
      impressions: input.impressions ?? 0,
      likes: input.likes ?? 0,
      comments: input.comments ?? 0,
      shares: input.shares ?? 0,
      saves: input.saves ?? 0,
      clicks: input.clicks ?? 0,
      followers: input.followers ?? 0,
      subscribers: input.subscribers ?? 0,
      replies: input.replies ?? 0,
      notes: input.notes ?? null,
      recordedAt: input.recordedAt ?? new Date(),
    })
    .returning();
  return row;
}

/** What is working, by platform, over the last N days. */
export async function platformStats(days: number) {
  const d = await db();
  const since = new Date(Date.now() - days * 86_400_000);
  const posted = await d
    .select({ piece: contentPieces, ideaTitle: contentIdeas.title, ideaSlug: contentIdeas.slug })
    .from(contentPieces)
    .innerJoin(contentIdeas, eq(contentIdeas.id, contentPieces.ideaId))
    .where(and(eq(contentPieces.status, "posted"), gte(contentPieces.postedAt, since)));
  const stats = await latestStats(posted.map(p => p.piece.id));

  type Row = { platform: string; posts: number; impressions: number; engagement: number; clicks: number; followers: number; subscribers: number; replies: number; visits: number; assessments: number; applications: number };
  const rows: Record<string, Row> = {};
  const rowFor = (platform: string) =>
    (rows[platform] ??= { platform, posts: 0, impressions: 0, engagement: 0, clicks: 0, followers: 0, subscribers: 0, replies: 0, visits: 0, assessments: 0, applications: 0 });

  const pieces = posted.map(p => {
    const ch = channelById(p.piece.channel);
    const s = stats.find(x => x.pieceId === p.piece.id);
    const engagement = s ? s.likes + s.comments + s.shares + s.saves : 0;
    const r = rowFor(ch?.platform ?? "other");
    r.posts += 1;
    if (s) {
      r.impressions += s.impressions;
      r.engagement += engagement;
      r.clicks += s.clicks;
      r.followers += s.followers;
      r.subscribers += s.subscribers;
      r.replies += s.replies;
    }
    return {
      id: p.piece.id,
      ideaId: p.piece.ideaId,
      ideaTitle: p.ideaTitle,
      channel: p.piece.channel,
      platform: ch?.platform ?? "other",
      title: p.piece.title,
      postedAt: p.piece.postedAt,
      url: p.piece.url,
      impressions: s?.impressions ?? 0,
      engagement,
      clicks: s?.clicks ?? 0,
      followers: s?.followers ?? 0,
      subscribers: s?.subscribers ?? 0,
      replies: s?.replies ?? 0,
      hasStats: Boolean(s),
    };
  });

  // What each platform sent to the site in the period, from the tagged links.
  const EV = sql`CASE WHEN ${analyticsEvents.eventData} LIKE '{%' THEN ${analyticsEvents.eventData}::jsonb ELSE '{}'::jsonb END`;
  const visits: any = await d.execute(sql`
    select ${EV} ->> 'utm_source' as source, count(distinct ${analyticsEvents.sessionId}) as sessions
    from ${analyticsEvents}
    where ${analyticsEvents.eventType} = 'page_view' and ${HUMAN_EVENT} and ${analyticsEvents.createdAt} >= ${since}
      and (${EV} ->> 'utm_source') is not null
    group by 1`);
  const reports: any = await d.execute(sql`
    select ${assessmentReports.utmSource} as source, count(*) as n from ${assessmentReports}
    where ${assessmentReports.createdAt} >= ${since} and ${assessmentReports.utmSource} is not null group by 1`);
  const apps: any = await d.execute(sql`
    select ${applications.utmSource} as source, count(*) as n from ${applications}
    where ${applications.createdAt} >= ${since} and ${applications.utmSource} is not null group by 1`);
  const known = new Set(CHANNELS.map(c => c.platform as string));
  for (const r of visits.rows ?? visits) if (known.has(String(r.source))) rowFor(String(r.source)).visits += Number(r.sessions);
  for (const r of reports.rows ?? reports) if (known.has(String(r.source))) rowFor(String(r.source)).assessments += Number(r.n);
  for (const r of apps.rows ?? apps) if (known.has(String(r.source))) rowFor(String(r.source)).applications += Number(r.n);

  pieces.sort((a, b) => b.engagement - a.engagement || b.impressions - a.impressions);
  return { since, platforms: Object.values(rows).sort((a, b) => b.engagement - a.engagement || b.visits - a.visits), pieces };
}
