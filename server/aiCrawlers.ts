/**
 * Who from the AI world is reading the site.
 *
 * The page view tracking in the browser never sees these. Crawlers do not run
 * JavaScript, so until now every visit from GPTBot, ClaudeBot or PerplexityBot
 * was invisible. This records them on the server, as `ai_crawl` events, so the
 * GEO section of the dashboard can show real numbers rather than guesses.
 *
 * Three kinds, because they mean different things:
 *   training  the crawl that feeds a model's training data
 *   search    the index behind an AI search or answer product
 *   live      a fetch made while a person is waiting for an answer, which is
 *             the one that matters most: it means the site was chosen as a
 *             source for a question somebody actually asked
 */
import type { Express, NextFunction, Request, Response } from "express";
import { trackEvent } from "./db";

export type CrawlerKind = "training" | "search" | "live";

export type AiCrawler = {
  /** Stable id stored in the event data. */
  id: string;
  /** What to show on the dashboard. */
  label: string;
  /** Whose crawler it is. */
  owner: string;
  kind: CrawlerKind;
  /** Matched against the user agent, case insensitive. Most specific first. */
  match: RegExp;
};

/**
 * Order matters. ChatGPT-User has to be tested before GPTBot, and
 * Google-Extended before Googlebot, or the broader pattern swallows it.
 */
export const AI_CRAWLERS: AiCrawler[] = [
  { id: "chatgpt-user", label: "ChatGPT (live fetch)", owner: "OpenAI", kind: "live", match: /ChatGPT-User/i },
  { id: "oai-searchbot", label: "ChatGPT Search", owner: "OpenAI", kind: "search", match: /OAI-SearchBot/i },
  { id: "gptbot", label: "GPTBot", owner: "OpenAI", kind: "training", match: /GPTBot/i },
  { id: "claude-user", label: "Claude (live fetch)", owner: "Anthropic", kind: "live", match: /Claude-User/i },
  { id: "claude-searchbot", label: "Claude Search", owner: "Anthropic", kind: "search", match: /Claude-SearchBot/i },
  { id: "claudebot", label: "ClaudeBot", owner: "Anthropic", kind: "training", match: /ClaudeBot|anthropic-ai/i },
  { id: "perplexity-user", label: "Perplexity (live fetch)", owner: "Perplexity", kind: "live", match: /Perplexity-User/i },
  { id: "perplexitybot", label: "PerplexityBot", owner: "Perplexity", kind: "search", match: /PerplexityBot/i },
  { id: "google-extended", label: "Google Extended (Gemini)", owner: "Google", kind: "training", match: /Google-Extended/i },
  { id: "google-inspection", label: "Google inspection", owner: "Google", kind: "search", match: /Google-InspectionTool/i },
  { id: "googlebot", label: "Googlebot", owner: "Google", kind: "search", match: /Googlebot/i },
  { id: "bingbot", label: "Bingbot (Copilot)", owner: "Microsoft", kind: "search", match: /bingbot|adidxbot/i },
  { id: "applebot-extended", label: "Applebot Extended", owner: "Apple", kind: "training", match: /Applebot-Extended/i },
  { id: "applebot", label: "Applebot", owner: "Apple", kind: "search", match: /Applebot/i },
  { id: "meta-ai", label: "Meta AI", owner: "Meta", kind: "training", match: /Meta-ExternalAgent|FacebookBot/i },
  { id: "amazonbot", label: "Amazonbot", owner: "Amazon", kind: "training", match: /Amazonbot/i },
  { id: "ccbot", label: "CCBot", owner: "Common Crawl", kind: "training", match: /CCBot/i },
  { id: "bytespider", label: "Bytespider", owner: "ByteDance", kind: "training", match: /Bytespider/i },
  { id: "duckassist", label: "DuckAssistBot", owner: "DuckDuckGo", kind: "search", match: /DuckAssistBot/i },
  { id: "youbot", label: "YouBot", owner: "You.com", kind: "search", match: /YouBot/i },
  { id: "cohere", label: "Cohere", owner: "Cohere", kind: "training", match: /cohere-ai|cohere-training-data-crawler/i },
  { id: "mistral", label: "MistralAI", owner: "Mistral", kind: "training", match: /MistralAI-User|Mistral/i },
  { id: "diffbot", label: "Diffbot", owner: "Diffbot", kind: "training", match: /Diffbot/i },
  { id: "timpibot", label: "Timpibot", owner: "Timpi", kind: "training", match: /Timpibot/i },
];

/** The crawler behind a user agent, or null when it is not one of them. */
export function matchAiCrawler(ua: string | null | undefined): AiCrawler | null {
  if (!ua) return null;
  for (const c of AI_CRAWLERS) if (c.match.test(ua)) return c;
  return null;
}

/** Look up a crawler by the id stored in an event. */
export function crawlerById(id: string): AiCrawler | undefined {
  return AI_CRAWLERS.find(c => c.id === id);
}

/**
 * Where an AI assistant sent a person, worked out from the referrer. These are
 * people, not crawlers, and they are the point of the whole exercise.
 */
export const AI_REFERRERS: { id: string; label: string; match: RegExp }[] = [
  { id: "chatgpt", label: "ChatGPT", match: /chatgpt\.com|chat\.openai\.com/i },
  { id: "perplexity", label: "Perplexity", match: /perplexity\.ai/i },
  { id: "claude", label: "Claude", match: /claude\.ai/i },
  { id: "gemini", label: "Gemini", match: /gemini\.google\.com|bard\.google\.com/i },
  { id: "copilot", label: "Copilot", match: /copilot\.microsoft\.com|bing\.com\/chat/i },
  { id: "grok", label: "Grok", match: /grok\.com|x\.ai/i },
  { id: "deepseek", label: "DeepSeek", match: /deepseek\.com/i },
  { id: "you", label: "You.com", match: /you\.com/i },
  { id: "poe", label: "Poe", match: /poe\.com/i },
];

export function matchAiReferrer(referrer: string | null | undefined): { id: string; label: string } | null {
  if (!referrer) return null;
  for (const r of AI_REFERRERS) if (r.match.test(referrer)) return { id: r.id, label: r.label };
  return null;
}

/** Paths that are not content and tell us nothing about how the site is read. */
const IGNORED = /^\/(api|assets|admin|payment|@vite|@react-refresh|src\/)/;
const ASSET = /\.(js|mjs|css|map|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|pdf)$/i;

/**
 * Records one `ai_crawl` event per AI crawler request for a real page. Runs
 * before the page is served and never blocks it: the write is fired off and
 * any failure is swallowed, because a logging problem must not take the site
 * down for the crawler that is reading it.
 */
export function registerAiCrawlerLog(app: Express) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();
    const path = req.path || "/";
    if (IGNORED.test(path) || ASSET.test(path)) return next();
    const ua = req.get("user-agent");
    const crawler = matchAiCrawler(ua);
    if (!crawler) return next();
    void trackEvent({
      eventType: "ai_crawl",
      eventData: JSON.stringify({ crawler: crawler.id, kind: crawler.kind, owner: crawler.owner, path }),
      sessionId: null,
      userAgent: (ua || "").slice(0, 500),
      referrer: (req.get("referer") || "").slice(0, 500) || null,
    }).catch(e => console.warn("[AI crawl] Could not record the visit:", e));
    next();
  });
}
