import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { articles } from "../client/src/data/articlesData";
import {
  articleCitations,
  articleWordCount,
} from "../client/src/data/articleMetadata";
import {
  getPageMeta,
  PUBLIC_PAGES,
  sitemapEntries,
} from "../client/src/data/siteMetadata";
import { informationPages } from "../client/src/pages/InformationPage";
import { HOME_FAQS } from "../shared/siteFaq";
import fixture from "./fixtures/geo-brief-2026-10-14.json";
import headingFixture from "./fixtures/h2-question-headings-2026-10-14.json";
import {
  positioningExpected,
  restoreApprovedPositioning,
} from "./positioning-test-helpers";

const root = path.resolve(import.meta.dirname, "..");
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const graph = (route: string) =>
  getPageMeta(route).structuredData?.["@graph"] as Record<string, any>[];
const openings = fixture.openings as Record<string, string>;
const originalHashes = fixture.originalBodyHashes as Record<string, string>;
const sourceLinks = fixture.sourceLinks as Record<
  string,
  { name: string; url: string }[]
>;

describe("Exact GEO brief, 14 October 2026", () => {
  it("serves the exact supplied llms.txt content, including its original whitespace", () => {
    expect(
      hash(
        restoreApprovedPositioning(
          "client/public/llms.txt",
          fs.readFileSync(path.join(root, "client/public/llms.txt"), "utf8")
        )
      )
    ).toBe(fixture.llmsSha256);
  });

  it("does not overwrite approved llms.txt when generating build assets", () => {
    const source = fs.readFileSync(
      path.join(root, "scripts/generate-seo.ts"),
      "utf8"
    );
    expect(source).toContain(
      'fs.readFileSync(path.join(dir, "llms.txt"), "utf8")'
    );
    expect(source).not.toMatch(/writeFileSync\([^;]*["']llms\.txt["']/);
    expect(
      fs
        .readFileSync(path.join(root, "client/public/llms-full.txt"), "utf8")
        .startsWith(
          fs.readFileSync(path.join(root, "client/public/llms.txt"), "utf8")
        )
    ).toBe(true);
  });

  it("uses the complete supplied Person object on every page that has a graph", () => {
    const routes = [
      ...Object.keys(PUBLIC_PAGES),
      ...articles.map(a => `/insights/${a.slug}`),
      "/resources/sleep",
    ];
    for (const route of routes) {
      const persons = graph(route).filter(
        n => n["@id"] === "https://marinlazic.com/#person"
      );
      expect(persons).toEqual([
        {
          ...fixture.person,
          jobTitle: positioningExpected.personJobTitle,
          description: positioningExpected.personDescription,
        },
      ]);
      expect(persons[0].image).toContain("marin-about-photo_5aa64d77.jpg");
      expect(persons[0].image).not.toContain("/assets/marin-about-photo.jpg");
    }
  });

  it("adds the matching opening paragraph to all 15 articles and preserves the rest", () => {
    expect(articles).toHaveLength(15);
    for (const a of articles) {
      const opening = openings[a.slug];
      expect(a.content.startsWith(opening + "\n\n")).toBe(true);
      let body = a.content.slice(opening.length + 2);
      const approvedRenames =
        (headingFixture.changes as Record<string, Record<string, string>>)[
          a.slug
        ] ?? {};
      body = body
        .split("\n")
        .map(line => {
          const originalHeading = Object.entries(approvedRenames).find(
            ([, next]) => line === `## ${next}`
          )?.[0];
          return originalHeading ? `## ${originalHeading}` : line;
        })
        .join("\n");
      if (a.slug === "how-to-boost-your-hrv") {
        body = body
          .replace(
            "## How do you raise HRV safely?",
            "## Five sensible ways to support HRV"
          )
          .replace(
            "## How should you track HRV week to week?",
            "## A simple tracking template"
          )
          .replace("## When should you see a doctor about low HRV?\n\n", "");
      }
      expect(hash(body)).toBe(originalHashes[a.slug]);
      expect(a.dateModified).toBe("2026-10-14");
    }
  });

  it("adds all requested BlogPosting fields and keeps image, tags and author references consistent", () => {
    for (const a of articles) {
      const meta = getPageMeta(`/insights/${a.slug}`);
      const post = graph(`/insights/${a.slug}`).find(
        n => n["@type"] === "BlogPosting"
      )!;
      expect(post.image).toBe(meta.ogImage);
      expect(post.keywords).toEqual(a.tags);
      expect(post.inLanguage).toBe("en-AU");
      expect(post.isAccessibleForFree).toBe(true);
      expect(post.wordCount).toBe(articleWordCount(a.content));
      expect(post.wordCount).toBeGreaterThan(100);
      expect(post.author).toEqual({ "@id": "https://marinlazic.com/#person" });
      expect(post.publisher).toEqual(post.author);
    }
  });

  it("includes exactly the Sources links, not inline duplicates or related resources", () => {
    for (const a of articles) {
      const citations = articleCitations(a.content);
      expect(citations.map(({ name, url }) => ({ name, url }))).toEqual(
        sourceLinks[a.slug]
      );
      expect(citations.every(c => !c.url.includes("/resources/"))).toBe(true);
      const post = graph(`/insights/${a.slug}`).find(
        n => n["@type"] === "BlogPosting"
      )!;
      expect(post.citation).toEqual(citations);
    }
  });

  it("classifies PubMed, PMC and journal links as ScholarlyArticle and other links as WebPage", () => {
    const citations = articles.flatMap(a => articleCitations(a.content));
    for (const citation of citations) {
      const scholarly =
        /pmc\.ncbi\.nlm\.nih\.gov|pubmed\.ncbi\.nlm\.nih\.gov|doi\.org|jamanetwork\.com|endocrine\.org\/journals\//.test(
          citation.url
        );
      expect(citation["@type"]).toBe(
        scholarly ? "ScholarlyArticle" : "WebPage"
      );
    }
    expect(
      articleCitations(
        "## Sources\n\n- [Journal](https://journals.plos.org/article)\n\n## Related resources\n\n- [Not a citation](https://example.com/)"
      )[0]["@type"]
    ).toBe("ScholarlyArticle");
  });

  it("counts body words without markup or link URL words", () => {
    expect(
      articleWordCount(
        "## First heading\n\nA **clear** [source name](https://example.com/irrelevant-words).\n\n- One item\n1. Second item"
      )
    ).toBe(10);
    expect(articleWordCount("")).toBe(0);
    expect(articleWordCount("Dénes Kemény's long-term plan.")).toBe(4);
  });

  it("places the three HRV question-style H2s exactly where requested", () => {
    const hrv = articles.find(a => a.slug === "how-to-boost-your-hrv")!.content;
    expect(hrv).toContain("## How do you raise HRV safely?\n\n### 1.");
    expect(hrv).toContain(
      "## How should you track HRV week to week?\n\n**Illustrative"
    );
    expect(hrv).toContain(
      "## When should you see a doctor about low HRV?\n\nIf HRV stays unusually low for you"
    );
  });

  it("adds the seven exact experience paragraphs directly after the About story section", () => {
    const about = informationPages["/about"];
    expect(about.sections[0].heading).toBe("Work");
    expect(about.sections[1]).toEqual({
      heading: "Experience and qualifications",
      content: fixture.about,
    });
  });

  it("appends both exact homepage questions and their identical FAQ schema answers", () => {
    const approvedFaqs = fixture.faqs.map(f =>
      f.q === "Who is Marin Lazic?" ? { ...f, a: positioningExpected.faq } : f
    );
    expect(HOME_FAQS.slice(-2)).toEqual(approvedFaqs);
    const schema = graph("/").find(n => n["@type"] === "FAQPage")!;
    expect(
      schema.mainEntity
        .slice(-2)
        .map((q: any) => ({ q: q.name, a: q.acceptedAnswer.text }))
    ).toEqual(approvedFaqs);
  });

  it("preserves a real space around the visual H1 line break", () => {
    const home = fs.readFileSync(
      path.join(root, "client/src/pages/Home.tsx"),
      "utf8"
    );
    expect(home).toMatch(/Marin\s*<br\s*\/> +Lazic/);
  });

  it("changes only home, About and the edited article lastmod dates", () => {
    const oldDates = new Map(
      fixture.originalSitemapEntries.map(e => [e.path, e.lastmod])
    );
    for (const entry of sitemapEntries()) {
      const changed =
        entry.path === "/" ||
        entry.path === "/about" ||
        entry.path.startsWith("/insights/");
      expect(entry.lastmod).toBe(
        changed ? "2026-10-14" : oldDates.get(entry.path)
      );
    }
  });

  it("keeps recorded lastmod dates unchanged on future build days", () => {
    const before = sitemapEntries();
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2040-01-01T00:00:00Z"));
      expect(sitemapEntries()).toEqual(before);
    } finally {
      vi.useRealTimers();
    }
  });
});
