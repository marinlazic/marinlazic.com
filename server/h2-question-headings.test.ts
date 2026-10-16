import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { articles } from "../client/src/data/articlesData";
import { getPageMeta } from "../client/src/data/siteMetadata";
import fixture from "./fixtures/h2-question-headings-2026-10-14.json";
import { restoreApprovedPositioning } from "./positioning-test-helpers";

const root = path.resolve(import.meta.dirname, "..");
const changes = fixture.changes as Record<string, Record<string, string>>;
const baselineHashes = fixture.baselineArticleHashes as Record<string, string>;
const baselineH2s = fixture.baselineH2s as Record<string, string[]>;
const originalDates = fixture.originalDateModified as Record<string, string>;
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const h2s = (value: string) =>
  Array.from(value.matchAll(/^## (.*)$/gm), m => m[1]);

function restoreH2s(content: string, renames: Record<string, string>): string {
  return content
    .split("\n")
    .map(line => {
      const prior = Object.entries(renames).find(
        ([, next]) => line === `## ${next}`
      )?.[0];
      return prior ? `## ${prior}` : line;
    })
    .join("\n");
}

function stableArticle(value: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, value[key]])
    )
  );
}

describe("Question H2 brief, 14 articles", () => {
  it("renames exactly the 69 listed H2s and keeps every unlisted H2 in place", () => {
    expect(Object.keys(changes)).toHaveLength(14);
    expect(
      Object.values(changes).reduce(
        (sum, pairs) => sum + Object.keys(pairs).length,
        0
      )
    ).toBe(69);
    for (const a of articles) {
      const renames = changes[a.slug] ?? {};
      const headings = h2s(a.content);
      expect(headings).toEqual(
        baselineH2s[a.slug].map(before => renames[before] ?? before)
      );
      for (const [old, next] of Object.entries(renames)) {
        expect(headings.filter(h => h === next)).toHaveLength(1);
        expect(headings).not.toContain(old);
      }
    }
  });

  it("preserves every other body character and article field against the saved baseline", () => {
    for (const a of articles) {
      const restored = {
        ...a,
        content: restoreH2s(a.content, changes[a.slug] ?? {}),
        dateModified: originalDates[a.slug],
      };
      expect(hash(stableArticle(restored))).toBe(baselineHashes[a.slug]);
    }
  });

  it("leaves the HRV article completely unchanged", () => {
    const hrv = articles.find(a => a.slug === "how-to-boost-your-hrv")!;
    expect(changes[hrv.slug]).toBeUndefined();
    expect(hash(stableArticle(hrv as unknown as Record<string, unknown>))).toBe(
      baselineHashes[hrv.slug]
    );
  });

  it("keeps the 14 BlogPosting and sitemap dates at the explicitly requested date", () => {
    const xml = new XMLParser().parse(
      fs.readFileSync(path.join(root, "client/public/sitemap.xml"), "utf8")
    );
    for (const slug of Object.keys(changes)) {
      const route = `/insights/${slug}`;
      const graph = getPageMeta(route).structuredData!["@graph"] as Record<
        string,
        any
      >[];
      expect(
        graph.find(node => node["@type"] === "BlogPosting")?.dateModified
      ).toBe("2026-10-14");
      expect(
        xml.urlset.url.find(
          (url: any) => url.loc === `https://marinlazic.com${route}`
        ).lastmod
      ).toBe("2026-10-14");
    }
  });

  it("does not edit llms.txt, sitemap dates, shared metadata or the article renderer", () => {
    for (const [name, baseline] of Object.entries(
      fixture.unchangedFileHashes
    )) {
      expect(
        hash(
          restoreApprovedPositioning(
            name,
            fs.readFileSync(path.join(root, name), "utf8")
          )
        )
      ).toBe(baseline);
    }
  });

  it("changes only the same H2 texts in the generated full reference file", () => {
    let slug = "";
    const full = fs.readFileSync(
      path.join(root, "client/public/llms-full.txt"),
      "utf8"
    );
    const restored = restoreApprovedPositioning(
      "client/public/llms-full.txt",
      full
    )
      .split("\n")
      .map(line => {
        const source = line.match(
          /^Source: https:\/\/marinlazic\.com\/insights\/([^/]+)$/
        );
        if (source) slug = source[1];
        if (line === "## Resource reference content") slug = "";
        return restoreH2s(line, changes[slug] ?? {});
      })
      .join("\n");
    expect(hash(restored)).toBe(fixture.baselineCompanionHash);
  });

  it("uses the exact supplied question form without changing protected section headings", () => {
    for (const pairs of Object.values(changes)) {
      for (const [old, next] of Object.entries(pairs)) {
        expect(next.endsWith("?")).toBe(true);
        expect(next).not.toMatch(/[—-]/);
        expect([
          "Key points",
          "Key takeaways",
          "Sources",
          "Related resources",
        ]).not.toContain(old);
      }
    }
  });
});
