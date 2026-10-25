import { describe, expect, it } from "vitest";
import { PROGRAMS, SECTIONS, programPath } from "../shared/programs";
import { getPageMeta, sitemapEntries, canonicalPathFor } from "../client/src/data/siteMetadata";

describe("program library", () => {
  it("has unique slugs, known sections and Bridge buy links", () => {
    const slugs = PROGRAMS.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of PROGRAMS) {
      expect(SECTIONS.some(s => s.id === p.section)).toBe(true);
      expect(p.buyUrl).toMatch(/^https:\/\/bridgeathletic\.com\/product\//);
      expect(p.price).toBeGreaterThan(0);
    }
  });
  it("lists the library and each program in the sitemap", () => {
    const paths = sitemapEntries().map(e => e.path);
    expect(paths).toContain("/library");
    for (const p of PROGRAMS) expect(paths).toContain(programPath(p));
  });
  it("gives each program page Product, Offer and FAQ data", () => {
    for (const p of PROGRAMS) {
      const meta = getPageMeta(programPath(p));
      expect(meta.notFound).toBeFalsy();
      const json = JSON.stringify(meta.structuredData);
      expect(json).toContain('"Product"');
      expect(json).toContain('"Offer"');
      expect(json).toContain("FAQPage");
      expect(canonicalPathFor(programPath(p))).toBe(programPath(p));
    }
  });
  it("returns not found for an unknown program", () => {
    expect(getPageMeta("/library/nope").notFound).toBe(true);
  });
  it("uses no dashes in program copy", () => {
    const text = JSON.stringify(PROGRAMS.map(({ buyUrl, image, slug, section, modified, ...rest }) => rest));
    expect(text).not.toMatch(/[-–—]/);
  });
});
