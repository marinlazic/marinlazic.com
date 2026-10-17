import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { XMLValidator, XMLParser } from "fast-xml-parser";
import {
  getPageMeta,
  canonicalPathFor,
  sitemapEntries,
  PUBLIC_PAGES,
} from "../client/src/data/siteMetadata";
import { articles } from "../client/src/data/articlesData";
import { resources } from "../client/src/pages/ResourcePage";
import { HOME_FAQS, APPLY_FAQS } from "../shared/siteFaq";
import { composeHtml, buildHeadTags } from "./seoHtml";

const root = path.resolve(import.meta.dirname, "..");
const graph = (url: string) =>
  getPageMeta(url).structuredData?.["@graph"] as Record<string, any>[];
describe("GEO and AEO publication regression guards", () => {
  it("uses a distinct canonical, title and social URL for each article", () => {
    const titles = new Set<string>();
    for (const a of articles) {
      const path = `/insights/${a.slug}`;
      const head = getPageMeta(path + "?utm_source=chatgpt");
      expect(head.canonicalPath).toBe(path);
      expect(head.title).toBe(`${a.seoTitle ?? a.title} | Marin Lazic`);
      // Search result titles are cut off around 60 characters.
      expect((a.seoTitle ?? a.title).length).toBeLessThanOrEqual(60);
      expect(head.description).toBe(a.excerpt);
      expect(head.ogType).toBe("article");
      expect(buildHeadTags(head)).toContain(`https://marinlazic.com${path}`);
      expect((buildHeadTags(head).match(/rel="canonical"/g) || []).length).toBe(
        1
      );
      titles.add(head.title);
    }
    expect(titles.size).toBe(articles.length);
  });
  it("describes each article with its own author, dates and breadcrumbs", () => {
    for (const a of articles) {
      const nodes = graph(`/insights/${a.slug}`);
      const article = nodes.find(n => n["@type"] === "BlogPosting");
      expect(article?.headline).toBe(a.title);
      expect(article?.datePublished).toBe(a.date);
      expect(article?.dateModified).toBe(a.dateModified);
      expect(article?.author["@id"]).toBe("https://marinlazic.com/#person");
      expect(nodes.some(n => n["@type"] === "FAQPage")).toBe(false);
      expect(
        nodes.find(n => n["@type"] === "BreadcrumbList")?.itemListElement
      ).toHaveLength(3);
    }
  });
  it("has identical visible FAQ data and page-specific FAQ schema", () => {
    for (const [url, faqs] of [
      ["/", HOME_FAQS],
      ["/apply", APPLY_FAQS],
    ] as const) {
      const schema = graph(url).find(n => n["@type"] === "FAQPage");
      expect(
        schema?.mainEntity.map((q: any) => ({
          q: q.name,
          a: q.acceptedAnswer.text,
        }))
      ).toEqual(faqs);
    }
    expect(JSON.stringify(graph("/"))).not.toContain("SearchAction");
    expect(JSON.stringify(graph("/"))).not.toContain("alumniOf");
    expect(
      graph("/").find(n => n["@type"] === "Person")?.hasCredential
    ).toHaveLength(3);
  });
  it("does not turn the removed article or unknown pages into indexable pages", () => {
    for (const url of [
      "/insights/what-to-expect-2100-per-month-performance-coach",
      "/insights/bogus",
      "/resources/bogus",
      "/does-not-exist",
    ]) {
      const head = getPageMeta(url);
      expect(head.notFound).toBe(true);
      expect(head.noindex).toBe(true);
      expect(head.canonicalPath).toBeUndefined();
      expect(head.structuredData).toBeUndefined();
    }
  });
  it("normalises aliases and strips tracking only from canonical hints", () => {
    expect(canonicalPathFor("/resources/fewer?utm_campaign=mail")).toBe(
      "/resources/template"
    );
    expect(canonicalPathFor("/resources/5-movement-template")).toBe(
      "/resources/template"
    );
    expect(canonicalPathFor("/book-a-call")).toBe("/call");
    expect(canonicalPathFor("/blood-work")).toBe("/bloodwork");
    expect(canonicalPathFor("/hrv-conditioning")).toBe("/hrv-program");
  });
  it("protects private and unconfirmed destinations from indexing", () => {
    for (const url of [
      "/admin",
      "/payment/success",
      "/payment/cancel",
      "/bloodwork",
      "/hrv-program",
      "/call",
    ])
      expect(getPageMeta(url).noindex).toBe(true);
    expect(getPageMeta("/admin").canonicalPath).toBeUndefined();
    expect(
      sitemapEntries().some(e =>
        ["/admin", "/call", "/bloodwork", "/hrv-program"].includes(e.path)
      )
    ).toBe(false);
  });
  it("generates valid XML from canonical route registries with truthful dates", () => {
    const sitemap = fs.readFileSync(
      path.join(root, "client/public/sitemap.xml"),
      "utf8"
    );
    expect(XMLValidator.validate(sitemap)).toBe(true);
    const data = new XMLParser().parse(sitemap);
    const urls = data.urlset.url;
    expect(urls.map((r: any) => r.loc).sort()).toEqual(
      sitemapEntries()
        .map(e => `https://marinlazic.com${e.path}`)
        .sort()
    );
    expect(new Set(urls.map((r: any) => r.loc)).size).toBe(urls.length);
    for (const a of articles) expect(a.dateModified! >= a.date).toBe(true);
  });
  it("excludes private paths equally for all crawlers", () => {
    const robots = fs.readFileSync(
      path.join(root, "client/public/robots.txt"),
      "utf8"
    );
    expect(robots.match(/^User-agent:/gm)).toHaveLength(1);
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://marinlazic.com/sitemap.xml");
  });
  it("escapes head and state content without mangling dollar amounts", () => {
    const head = {
      title: "</title><script>bad()</script> $2,400",
      description: '" & < >',
      structuredData: {
        "@context": "https://schema.org",
        name: "</script><script>bad()</script>",
      },
    };
    const html = composeHtml(
      '<html><head><!--app-head--></head><body><div id="root"><!--app-html--></div></body></html>',
      "<p>$$50 $&amp; $2,400</p>",
      head,
      { queries: [{ x: "</script> $$50 $&" }] }
    );
    expect(html).toContain("<p>$$50 $&amp; $2,400</p>");
    expect(html).not.toContain("</title><script>bad()");
    expect(html).not.toContain("</script><script>bad()");
    expect(html).toContain("\\u003c/script>");
    expect(html).not.toContain("<!--app-head-->");
    expect(html).not.toContain("<!--app-html-->");
  });
  it("does not leave generic metadata in the source template", () => {
    const template = fs.readFileSync(
      path.join(root, "client/index.html"),
      "utf8"
    );
    expect(template).toContain("<!--app-head-->");
    expect(template).toContain("<!--app-html-->");
    expect(template).not.toContain("<title>");
    expect(template).not.toContain('rel="canonical"');
    expect(template).not.toContain("application/ld+json");
  });
  it("preserves nine resources and provides canonical metadata for every registered public page", () => {
    expect(resources).toHaveLength(9);
    for (const url of Object.keys(PUBLIC_PAGES))
      expect(getPageMeta(url).notFound).not.toBe(true);
    for (const r of resources)
      expect(getPageMeta(`/resources/${r.slug}`).notFound).not.toBe(true);
  });
  it("does not reintroduce invented client results, banned copy or unverified credentials", () => {
    const content = JSON.stringify(articles);
    expect(content).not.toMatch(
      /—|\boptimis\w*|\boptimiz\w*|not just\b|Sam's 24-Week|DHT Contamination|Up to 9%/i
    );
    for (const a of articles) expect(a.hasSamStory).toBe(false);
    expect(content).not.toContain(
      "what-to-expect-2100-per-month-performance-coach"
    );
  });
  it("keeps AI-assisted reports inside coaching and healthcare boundaries", () => {
    const source = fs.readFileSync(
      path.join(root, "server/routers.ts"),
      "utf8"
    );
    expect(source).toContain(
      "Treat assessment answers as unverified self-reports"
    );
    expect(source).toContain(
      "Do not prescribe supplements, medicines, diagnostic blood tests or injury rehabilitation"
    );
    expect(source).toContain(
      "Do not promise numerical HRV, recovery, productivity or lifespan improvements"
    );
  });
});
