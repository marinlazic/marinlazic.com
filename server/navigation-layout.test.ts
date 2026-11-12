import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { XMLParser } from "fast-xml-parser";

vi.mock("../client/src/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}));

import { Nav } from "../client/src/pages/Home";

function navigation() {
  const html = renderToStaticMarkup(createElement(Nav));
  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
  }).parse(html);
  return { html, nav: parsed.nav };
}

describe("Site header layout and destinations", () => {
  it("keeps the name as the home link with a full size tap target", () => {
    const { nav } = navigation();
    const row = nav.div;
    expect(nav["@aria-label"]).toBe("Main navigation");
    expect(row.a["@aria-label"]).toBe("Marin Lazic home");
    expect(row.a["@href"]).toBe("/");
    expect(row.a["@class"]).toContain("shrink-0");
    expect(row.a["@class"]).toContain("min-h-11");
    expect(row.a["#text"]).toBe("Marin Lazic");
  });

  it("uses the menu button until the full header has enough desktop space", () => {
    const { nav } = navigation();
    const [left, right, compact] = nav.div.div;
    expect(left["@class"]).toContain("hidden xl:flex");
    expect(left["@class"]).toContain("whitespace-nowrap");
    expect(right["@class"]).toContain("hidden xl:flex");
    expect(compact["@class"]).toContain("xl:hidden");
    expect(compact.a["@href"]).toBe("/assessment");
    expect(compact.button["@class"]).toContain("min-w-11");
    expect(compact.button["@aria-expanded"]).toBe("false");
    expect(compact.button["@aria-controls"]).toBe("main-mobile-menu");
  });

  it("keeps every existing navigation and conversion destination", () => {
    const { nav } = navigation();
    const [left, right] = nav.div.div;
    const hrefs = (group: { a: Record<string, string>[] }) =>
      group.a.map(a => a["@href"]);
    expect(hrefs(left)).toEqual([
      "/library",
      "/executive-health-performance",
      "/corporate-health-performance",
      "/resources",
    ]);
    expect(hrefs(right)).toEqual([
      "/about",
      "/speaking",
      "/media",
      "/#contact",
      "/apply",
      "/assessment",
    ]);
  });
});
