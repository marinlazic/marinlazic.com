import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { getPageMeta } from "../client/src/data/siteMetadata";
import { HOME_FAQS, APPLY_FAQS } from "../shared/siteFaq";
import { buildHeadTags, escapeHtml } from "./seoHtml";
import { restoreApprovedPositioning } from "./positioning-test-helpers";
import fixture from "./fixtures/positioning-2026-10-14.json";

const root = path.resolve(import.meta.dirname, "..");
const expected = fixture.expected;
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const graph = (route: string) =>
  getPageMeta(route).structuredData?.["@graph"] as Record<string, any>[];
const value = (html: string, attr: string, key: string) =>
  html.match(new RegExp(`${attr}="${key}" content="([^"]*)"`))?.[1];

function restoreMeta(route: string) {
  const meta = JSON.parse(JSON.stringify(getPageMeta(route)));
  if (route === "/" || route === "/about") {
    const old =
      route === "/" ? fixture.originalHomeHead : fixture.originalAboutHead;
    meta.title = old.title;
    meta.description = old.description;
    delete meta.socialTitle;
    delete meta.socialDescription;
  }
  for (const node of meta.structuredData?.["@graph"] ?? []) {
    if (node["@id"] === "https://marinlazic.com/#person") {
      node.jobTitle = fixture.originalPerson.jobTitle;
      node.description = fixture.originalPerson.description;
    }
    if (route === "/" && node["@type"] === "FAQPage") {
      const old = fixture.originalHomeFaq.find(
        f => f.q === "Who is Marin Lazic?"
      )!;
      node.mainEntity.find((q: any) => q.name === old.q).acceptedAnswer.text =
        old.a;
    }
  }
  return meta;
}

describe("Exact positioning brief, 14 October 2026", () => {
  it("uses the exact homepage title with Sydney and distinct social titles without Sydney", () => {
    const meta = getPageMeta("/");
    expect(meta.title).toBe(expected.homeTitle);
    expect(meta.socialTitle).toBe(expected.homeSocialTitle);
    const html = buildHeadTags(meta);
    expect(html).toContain(
      `<title data-site-head>${escapeHtml(expected.homeTitle)}</title>`
    );
    expect(value(html, "property", "og:title")).toBe(expected.homeSocialTitle);
    expect(value(html, "name", "twitter:title")).toBe(expected.homeSocialTitle);
  });

  it("uses the full exact home description for all three description tags", () => {
    expect(expected.homeDescription.length).toBeLessThanOrEqual(200);
    const meta = getPageMeta("/");
    expect(meta.description).toBe(expected.homeDescription);
    const html = buildHeadTags(meta);
    for (const [attr, key] of [
      ["name", "description"],
      ["property", "og:description"],
      ["name", "twitter:description"],
    ]) {
      expect(value(html, attr, key)).toBe(escapeHtml(expected.homeDescription));
    }
  });

  it("changes only the hero text inside its existing paragraph markup", () => {
    const source = fs.readFileSync(
      path.join(root, "client/src/pages/Home.tsx"),
      "utf8"
    );
    const paragraph = source.match(
      /<p className="text-base sm:text-lg text-black\/70 max-w-lg leading-relaxed font-light">([\s\S]*?)<\/p>/
    )![1];
    expect(paragraph.replace(/\s+/g, " ").trim()).toBe(expected.hero);
    expect(
      hash(restoreApprovedPositioning("client/src/pages/Home.tsx", source))
    ).toBe(fixture.originalFileHashes["client/src/pages/Home.tsx"]);
  });

  it("changes only jobTitle and description on the shared Person object on every public route", () => {
    for (const route of Object.keys(fixture.baselineMetaHashes)) {
      const nodes = graph(route);
      if (!nodes) continue;
      const persons = nodes.filter(
        n => n["@id"] === "https://marinlazic.com/#person"
      );
      expect(persons).toEqual([
        {
          ...fixture.originalPerson,
          jobTitle: expected.personJobTitle,
          description: expected.personDescription,
        },
      ]);
    }
  });

  it("keeps the WebSite schema unchanged because it has no description field", () => {
    for (const route of Object.keys(fixture.baselineMetaHashes)) {
      const website = graph(route)?.find(n => n["@type"] === "WebSite");
      if (website) expect(website).not.toHaveProperty("description");
    }
  });

  it("changes only the supplied three llms lines and retains the required update date", () => {
    for (const name of [
      "client/public/llms.txt",
      "client/public/llms-full.txt",
    ]) {
      const text = fs.readFileSync(path.join(root, name), "utf8");
      expect(text).toContain(
        "> Performance coach for founders, training and recovery. Strength and Conditioning Coach for the Australian Men's Water Polo Team (the Aussie Sharks) and founder of Otion. Sydney, coaching online."
      );
      expect(text).toContain(
        "- [Home](https://marinlazic.com/): Performance coach for founders, training and recovery. Sydney, online."
      );
      expect(text).toContain(`Q: Who is Marin Lazic?\nA: ${expected.faq}`);
      expect(text).toContain("Last updated: 2026-10-14");
      expect(hash(restoreApprovedPositioning(name, text))).toBe(
        (fixture.originalFileHashes as Record<string, string>)[name]
      );
    }
  });

  it("updates only the Who is Marin Lazic answer in visible and structured FAQ data", () => {
    const faqs = fixture.originalHomeFaq.map(f =>
      f.q === "Who is Marin Lazic?" ? { ...f, a: expected.faq } : f
    );
    expect(HOME_FAQS).toEqual(faqs);
    expect(APPLY_FAQS).toEqual(fixture.originalApplyFaq);
    const faq = graph("/").find(n => n["@type"] === "FAQPage")!;
    expect(
      faq.mainEntity.map((q: any) => ({ q: q.name, a: q.acceptedAnswer.text }))
    ).toEqual(faqs);
  });

  it("updates the About title and meta description, preserving its unlisted social tags", () => {
    const meta = getPageMeta("/about");
    expect(meta.title).toBe(expected.aboutTitle);
    expect(meta.description).toBe(expected.aboutDescription);
    const html = buildHeadTags(meta);
    expect(value(html, "name", "description")).toBe(
      escapeHtml(expected.aboutDescription)
    );
    expect(value(html, "property", "og:title")).toBe(
      fixture.originalAboutHead.title
    );
    expect(value(html, "name", "twitter:title")).toBe(
      fixture.originalAboutHead.title
    );
    expect(value(html, "property", "og:description")).toBe(
      escapeHtml(fixture.originalAboutHead.description)
    );
    expect(value(html, "name", "twitter:description")).toBe(
      escapeHtml(fixture.originalAboutHead.description)
    );
  });

  it("preserves every other metadata and schema value on all existing routes", () => {
    for (const [route, baselineHash] of Object.entries(
      fixture.baselineMetaHashes
    )) {
      expect(hash(JSON.stringify(restoreMeta(route))), route).toBe(
        baselineHash
      );
    }
  });

  it("preserves all other source characters in the seven modified runtime files", () => {
    for (const [name, baselineHash] of Object.entries(
      fixture.originalFileHashes
    )) {
      const source = fs.readFileSync(path.join(root, name), "utf8");
      expect(hash(restoreApprovedPositioning(name, source)), name).toBe(
        baselineHash
      );
    }
    for (const [name, baselineHash] of Object.entries(
      fixture.unchangedFileHashes
    )) {
      expect(hash(fs.readFileSync(path.join(root, name))), name).toBe(
        baselineHash
      );
    }
  });

  it("keeps client navigation social metadata consistent with the SSR overrides", () => {
    const source = fs.readFileSync(
      path.join(root, "client/src/components/Head.tsx"),
      "utf8"
    );
    expect(source).toContain(
      'meta("og:title", head.socialTitle ?? head.title, true)'
    );
    expect(source).toContain(
      'meta("twitter:title", head.socialTitle ?? head.title)'
    );
    expect(
      source.match(/head\.socialDescription \?\? head\.description/g)
    ).toHaveLength(2);
  });
});
