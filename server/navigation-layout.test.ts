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

describe("Homepage logo and navigation separation", () => {
  it("reserves a fixed logo zone and a minimum gap before the links", () => {
    const { nav } = navigation();
    const row = nav.div;
    expect(row["@class"]).toContain("gap-12");
    expect(row.a["@aria-label"]).toBe("Marin Lazic home");
    expect(row.a["@class"]).toContain("min-w-16");
    expect(row.a["@class"]).toContain("shrink-0");
    expect(row.a["@class"]).toContain("min-h-11");
    expect(row.a["#text"]).toBe("ML");
  });

  it("uses the tablet menu until the full header has enough desktop space", () => {
    const { nav } = navigation();
    const row = nav.div;
    expect(row.div["@class"]).toContain("hidden xl:flex");
    expect(row.div["@class"]).toContain("shrink-0");
    expect(row.div["@class"]).toContain("whitespace-nowrap");
    expect(row.div.a[0]["#text"]).toBe("👋 About");
    expect(row.button["@class"]).toContain("xl:hidden");
    expect(row.button["@class"]).toContain("min-w-11");
    expect(row.button["@aria-expanded"]).toBe("false");
    expect(row.button["@aria-controls"]).toBe("main-mobile-menu");
  });

  it("keeps every existing navigation and conversion destination", () => {
    const { nav } = navigation();
    expect(nav["@aria-label"]).toBe("Main navigation");
    expect(
      nav.div.div.a.map((a: Record<string, string>) => a["@href"])
    ).toEqual([
      "/about",
      "/executive-health-performance",
      "/corporate-health-performance",
      "/library",
      "/resources",
      "/media",
      "/speaking",
      "#contact",
      "/assessment",
      "/apply",
    ]);
  });
});
