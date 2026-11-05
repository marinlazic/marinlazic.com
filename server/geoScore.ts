/**
 * The GEO, AEO and LLMO scorecard, checked against the deployed site rather
 * than written down once and left to go stale.
 *
 * Three pillars:
 *   GEO   can an AI crawler read the site at all
 *   AEO   is a page shaped so an answer engine can quote it
 *   LLMO  does the rest of the web agree about who Marin is
 *
 * Everything on this page is checked live, by fetching the real pages. The
 * off site work that needs Marin or another organisation is listed on its own,
 * unscored, because guessing at it would be worse than saying it is open.
 */
import { ENV } from "./_core/env";

export type Pillar = "GEO" | "AEO" | "LLMO";

export type ScoreItem = {
  id: string;
  pillar: Pillar;
  label: string;
  weight: number;
  ok: boolean;
  detail: string;
};

export type OpenItem = { id: string; label: string; why: string; who: string };

type Fetched = { ok: boolean; status: number; body: string };

async function get(url: string): Promise<Fetched> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "marinlazic-geo-check" },
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, status: res.status, body: res.ok ? await res.text() : "" };
  } catch {
    return { ok: false, status: 0, body: "" };
  }
}

const hasType = (html: string, type: string) => new RegExp(`"@type"\\s*:\\s*"${type}"`).test(html);
const countTag = (html: string, tag: string) => (html.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;

/** The named AI crawlers robots.txt turns away. */
export function blockedCrawlers(robots: string, names: string[]): string[] {
  const blocks = robots.split(/\n(?=user-agent:)/i);
  const out: string[] = [];
  for (const name of names) {
    const block = blocks.find(b => new RegExp(`user-agent:\\s*${name}\\b`, "i").test(b));
    if (block && /disallow:\s*\/\s*$/im.test(block)) out.push(name);
  }
  const star = blocks.find(b => /user-agent:\s*\*/i.test(b));
  if (star && /disallow:\s*\/\s*$/im.test(star)) out.push("*");
  return out;
}

async function wikidataItem(): Promise<{ ok: boolean; detail: string }> {
  try {
    const url =
      "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=5&search=" +
      encodeURIComponent("Marin Lazic");
    const res = await fetch(url, { headers: { "user-agent": "marinlazic-geo-check" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, detail: `Wikidata did not answer (${res.status})` };
    const body = (await res.json()) as { search?: { id: string; label?: string; description?: string }[] };
    const hit = (body.search ?? []).find(s => /coach|water polo|strength/i.test(s.description ?? ""));
    return hit ? { ok: true, detail: `${hit.id}, ${hit.description}` } : { ok: false, detail: "no item for him yet" };
  } catch {
    return { ok: false, detail: "could not reach Wikidata" };
  }
}

export async function runGeoScore(crawlerNames: string[]) {
  const o = ENV.siteOrigin;
  const [llms, llmsFull, robots, sitemap, feed, home, wikidata] = await Promise.all([
    get(o + "/llms.txt"),
    get(o + "/llms-full.txt"),
    get(o + "/robots.txt"),
    get(o + "/sitemap.xml"),
    get(o + "/feed.xml"),
    get(o + "/"),
    wikidataItem(),
  ]);

  // The newest article in the sitemap, so the article checks run on real content.
  const articlePath = (sitemap.body.match(/<loc>[^<]*\/insights\/[^<]+<\/loc>/) || [""])[0]
    .replace(/<\/?loc>/g, "")
    .replace(o, "");
  const article = articlePath ? await get(o + articlePath) : { ok: false, status: 0, body: "" };

  const blocked = robots.ok ? blockedCrawlers(robots.body, crawlerNames) : [];
  const urlCount = (sitemap.body.match(/<loc>/g) || []).length;
  const lastmods = (sitemap.body.match(/<lastmod>[^<]+<\/lastmod>/g) ?? []).map(m => m.replace(/<\/?lastmod>/g, ""));
  const newest = lastmods.sort().at(-1) ?? null;
  const sitemapAgeDays = newest ? Math.round((Date.now() - new Date(newest).getTime()) / 86_400_000) : null;
  const feedItems = (feed.body.match(/<item>/g) || []).length;
  const citations = (article.body.match(/"citation"/g) || []).length;
  const internalLinks = (article.body.match(/href="\/(insights|resources|about|apply)/g) || []).length;
  const imagesWithoutAlt = (article.body.match(/<img(?![^>]*\balt=)[^>]*>/g) || []).length;
  const questionH2s = (article.body.match(/<h2[^>]*>[^<]*\?/g) || []).length;

  const items: ScoreItem[] = [
    // GEO: can a crawler read it
    { id: "llms", pillar: "GEO", label: "llms.txt served", weight: 10, ok: llms.ok && llms.body.length > 200, detail: llms.ok ? `${llms.body.length.toLocaleString()} characters` : `not served (${llms.status})` },
    { id: "llms-full", pillar: "GEO", label: "llms-full.txt served", weight: 8, ok: llmsFull.ok && llmsFull.body.length > 1000, detail: llmsFull.ok ? `${llmsFull.body.length.toLocaleString()} characters` : `not served (${llmsFull.status})` },
    { id: "robots", pillar: "GEO", label: "robots.txt lets AI crawlers in", weight: 12, ok: robots.ok && blocked.length === 0, detail: !robots.ok ? `not served (${robots.status})` : blocked.length ? `blocks ${blocked.join(", ")}` : "every AI crawler allowed" },
    { id: "sitemap", pillar: "GEO", label: "sitemap current", weight: 8, ok: sitemap.ok && urlCount > 0 && (sitemapAgeDays ?? 999) < 60, detail: sitemap.ok ? `${urlCount} pages, newest change ${newest ?? "unknown"}` : `not served (${sitemap.status})` },
    { id: "feed", pillar: "GEO", label: "RSS feed", weight: 5, ok: feed.ok && feedItems > 0, detail: feed.ok ? `${feedItems} articles` : `not served (${feed.status})` },

    // AEO: shaped to be quoted
    { id: "person", pillar: "AEO", label: "Person schema", weight: 12, ok: hasType(home.body, "Person"), detail: hasType(home.body, "Person") ? "on the home page" : "missing" },
    { id: "faq", pillar: "AEO", label: "FAQ schema", weight: 8, ok: hasType(home.body, "FAQPage"), detail: hasType(home.body, "FAQPage") ? "on the home page" : "missing" },
    { id: "article", pillar: "AEO", label: "Article schema with sources", weight: 10, ok: hasType(article.body, "BlogPosting") && citations > 0, detail: article.ok ? `BlogPosting ${hasType(article.body, "BlogPosting") ? "present" : "missing"}, ${citations} citation block${citations === 1 ? "" : "s"}` : "could not read an article" },
    { id: "meta", pillar: "AEO", label: "Canonical and social tags", weight: 6, ok: /rel="canonical"/.test(home.body) && /property="og:title"/.test(home.body), detail: /rel="canonical"/.test(home.body) ? "canonical and Open Graph present" : "missing" },
    { id: "headings", pillar: "AEO", label: "One H1, question style H2s", weight: 6, ok: countTag(home.body, "h1") === 1 && countTag(article.body, "h1") === 1 && questionH2s > 0, detail: `home ${countTag(home.body, "h1")} H1, article ${countTag(article.body, "h1")} H1, ${questionH2s} question headings` },
    { id: "alt", pillar: "AEO", label: "Images described", weight: 4, ok: article.ok && imagesWithoutAlt === 0, detail: article.ok ? (imagesWithoutAlt === 0 ? "every image has alt text" : `${imagesWithoutAlt} without alt text`) : "could not read an article" },
    { id: "links", pillar: "AEO", label: "Internal links on articles", weight: 4, ok: internalLinks >= 5, detail: article.ok ? `${internalLinks} links to other pages` : "could not read an article" },

    // LLMO: does the rest of the web agree
    { id: "wikidata", pillar: "LLMO", label: "Wikidata item", weight: 10, ok: wikidata.ok, detail: wikidata.detail },
  ];

  const pillars = (["GEO", "AEO", "LLMO"] as const).map(pillar => {
    const rows = items.filter(i => i.pillar === pillar);
    const total = rows.reduce((s, i) => s + i.weight, 0);
    const earned = rows.filter(i => i.ok).reduce((s, i) => s + i.weight, 0);
    return { pillar, earned, total, score: total ? Math.round((earned / total) * 100) : 0 };
  });
  const earned = items.filter(i => i.ok).reduce((s, i) => s + i.weight, 0);
  const total = items.reduce((s, i) => s + i.weight, 0);

  /** Off site work. Nobody can check these from here, so they are not scored. */
  const open: OpenItem[] = [
    { id: "wpa", label: "Water Polo Australia staff page", why: "One line on the national team page outweighs every other item for LLMO", who: "Ask Tim Hamill or WPA communications" },
    { id: "search-console", label: "Google Search Console", why: "Until it is verified nobody can see what Google indexes or which queries bring visitors", who: "You, 10 minutes" },
    { id: "bing", label: "Bing Webmaster Tools", why: "Copilot and ChatGPT search read Bing's index, and it shows the IndexNow receipts", who: "You, 10 minutes" },
    { id: "gbp", label: "Google Business Profile", why: "Feeds performance coach Sydney queries and the AI overviews that pull from Maps", who: "You" },
    { id: "bios", label: "One bio on every profile", why: "LLMs cross check LinkedIn, Instagram, X, Substack and YouTube; they must say the same thing", who: "You, text is ready" },
    { id: "press", label: "More independent pages", why: "Two or three podcast or interview appearances a quarter. LLMs weight how many separate sources agree", who: "You" },
  ];

  return { items, pillars, earned, total, score: total ? Math.round((earned / total) * 100) : 0, open, checkedAt: new Date().toISOString() };
}
