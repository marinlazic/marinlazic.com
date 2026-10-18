import fs from "node:fs";
import path from "node:path";
import { XMLValidator } from "fast-xml-parser";
import { articles } from "../client/src/data/articlesData";
import { resources } from "../client/src/pages/ResourcePage";
import {
  sitemapEntries,
  resourcePath,
  CANONICAL_ORIGIN,
} from "../client/src/data/siteMetadata";

const dir = path.resolve(import.meta.dirname, "../client/public");
const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const entries = sitemapEntries();
if (new Set(entries.map(e => e.path)).size !== entries.length)
  throw new Error("Duplicate sitemap URLs");
for (const e of entries) {
  if (e.lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod))
    throw new Error(`Invalid lastmod for ${e.path}`);
}
for (const a of articles) {
  if (a.dateModified && a.dateModified < a.date)
    throw new Error(`Modification before publication: ${a.slug}`);
}
// Lastmod is read only from recorded content revisions, never the current build date.
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries
    .map(
      e =>
        `  <url><loc>${xmlEscape(CANONICAL_ORIGIN + e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`
    )
    .join("\n") +
  "\n</urlset>\n";
const validation = XMLValidator.validate(xml);
if (validation !== true) throw new Error(JSON.stringify(validation));
fs.writeFileSync(path.join(dir, "sitemap.xml"), xml);

// llms.txt is the approved, hand-maintained brief. Builds must never rewrite it.
const concise = fs.readFileSync(path.join(dir, "llms.txt"), "utf8");
if (!concise.startsWith("# Marin Lazic\n"))
  throw new Error("Missing approved llms.txt");
const full =
  concise +
  "\n## Article reference content\n\n" +
  articles
    .map(
      a =>
        `### ${a.title}\n\nSource: ${CANONICAL_ORIGIN}/insights/${a.slug}\nPublished: ${a.date}. Revised: ${a.dateModified || a.date}.\n\n${a.content}\n`
    )
    .join("\n") +
  "\n## Resource reference content\n\n" +
  resources
    .map(
      r =>
        `### ${r.title}\n\nSource: ${CANONICAL_ORIGIN}${resourcePath(r)}\n\n${r.intro}\n\n${r.sections.map(s => `${s.heading || ""}\n${s.content.join("\n")}`).join("\n\n")}\n`
    )
    .join("\n");
fs.writeFileSync(path.join(dir, "llms-full.txt"), full);

// RSS feed of the articles, newest first. Feed readers, Bing and answer
// engines use it to notice new and revised pieces without a full crawl.
const rfc822 = (d: string) => new Date(`${d}T00:00:00Z`).toUTCString();
const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
const latest = sorted
  .map(a => a.dateModified || a.date)
  .sort()
  .at(-1)!;
const rss =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n' +
  "<channel>\n" +
  "<title>Marin Lazic: Insights</title>\n" +
  `<link>${CANONICAL_ORIGIN}/insights</link>\n` +
  "<description>Research linked articles on training, recovery, sleep and nutrition for founders and busy professionals.</description>\n" +
  "<language>en-au</language>\n" +
  `<lastBuildDate>${rfc822(latest)}</lastBuildDate>\n` +
  `<atom:link href="${CANONICAL_ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />\n` +
  sorted
    .map(a => {
      const url = `${CANONICAL_ORIGIN}/insights/${a.slug}`;
      return (
        "<item>\n" +
        `<title>${xmlEscape(a.title)}</title>\n` +
        `<link>${url}</link>\n` +
        `<guid isPermaLink="true">${url}</guid>\n` +
        `<pubDate>${rfc822(a.date)}</pubDate>\n` +
        "<dc:creator>Marin Lazic</dc:creator>\n" +
        a.tags.map(t => `<category>${xmlEscape(t)}</category>`).join("") + "\n" +
        `<description>${xmlEscape(a.excerpt)}</description>\n` +
        "</item>"
      );
    })
    .join("\n") +
  "\n</channel>\n</rss>\n";
const rssValidation = XMLValidator.validate(rss);
if (rssValidation !== true) throw new Error(JSON.stringify(rssValidation));
fs.writeFileSync(path.join(dir, "feed.xml"), rss);
console.log(
  `Generated and validated ${entries.length} canonical sitemap URLs; preserved approved llms.txt; refreshed llms-full.txt and feed.xml (${sorted.length} items).`
);
