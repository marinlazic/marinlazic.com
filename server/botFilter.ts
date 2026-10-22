/**
 * Who counts as a visitor.
 *
 * Crawlers, link previewers and the site's own smoke test all hit real pages
 * and used to land in the numbers: on 21 Oct 2026 half of the 160 "visits" in
 * a 30 day window were bots. Every analytics query filters on HUMAN_EVENT so
 * the dashboard counts people.
 *
 * A row with no user agent is kept. Browsers always send one, so an empty
 * value means the event was recorded without the header rather than that a
 * robot was hiding.
 */
import { sql } from "drizzle-orm";
import { analyticsEvents } from "../drizzle/schema";

/** Matched against the user agent, case insensitive, in Postgres and in Node. */
export const BOT_UA_PATTERN =
  "bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor|uptime|probe|scanner|curl|wget|python-requests|node-fetch|axios|postman|okhttp|go-http-client|marinlazic-smoke";

export const BOT_UA_RE = new RegExp(BOT_UA_PATTERN, "i");

export function isBotUa(ua: string | null | undefined): boolean {
  return Boolean(ua) && BOT_UA_RE.test(String(ua));
}

/** Drop crawlers and the smoke test from a query over analytics_events. */
export const HUMAN_EVENT = sql`(${analyticsEvents.userAgent} is null or ${analyticsEvents.userAgent} !~* ${BOT_UA_PATTERN})`;
