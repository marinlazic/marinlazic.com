import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseJson } from "./studio";
import { FORMATS, STYLE_GUIDE } from "./studioRules.generated";
import { autoFix, checkText } from "../shared/contentChecks";
import { CHANNELS, campaignKey, trackedLink } from "../shared/studioChannels";
import { resolveShortLink, SHORT_CHANNELS, SHORT_DESTINATIONS } from "./shortLinks";

const skill = path.resolve(import.meta.dirname, "../.claude/skills/content");

describe("studio rules", () => {
  it("has a spec for every channel and a channel for every spec", () => {
    const specs = fs.readdirSync(path.join(skill, "formats")).filter(f => f.endsWith(".md")).map(f => f.replace(/\.md$/, "")).sort();
    expect(CHANNELS.map(c => c.id).sort()).toEqual(specs);
    expect(Object.keys(FORMATS).sort()).toEqual(specs);
  });

  it("bundles the current style guide and specs (run pnpm studio:rules after editing the skill)", () => {
    expect(STYLE_GUIDE).toBe(fs.readFileSync(path.join(skill, "style-guide.md"), "utf8"));
    for (const [id, text] of Object.entries(FORMATS)) {
      expect(text).toBe(fs.readFileSync(path.join(skill, "formats", `${id}.md`), "utf8"));
    }
  });

  it("gives every channel a short link the server resolves", () => {
    for (const c of CHANNELS) expect(SHORT_CHANNELS[c.short], c.id).toBeDefined();
    expect(SHORT_DESTINATIONS.l).toBe("/library");
    expect(SHORT_DESTINATIONS.ap).toBe("/apply");
    const link = trackedLink("https://marinlazic.com", CHANNELS[0], "assessment", "no-off-season");
    expect(link).toBe("https://marinlazic.com/li/a/nooffseason");
    expect(resolveShortLink("li", "a", "nooffseason")).toBe("/assessment?utm_source=linkedin&utm_medium=social&utm_campaign=nooffseason");
    expect(campaignKey("No Off-Season 2026")).toBe("nooffseason2026");
  });
});

describe("style checks", () => {
  it("fixes the mechanical faults", () => {
    expect(autoFix("Build, peak — recover! Then rest 🙂 #training")).toBe("Build, peak, recover. Then rest training");
    expect(autoFix("Range 4–8 weeks")).toBe("Range 4, 8 weeks");
    expect(autoFix("Paper #FAF9F5 stays")).toBe("Paper #FAF9F5 stays");
  });

  it("reports what is left for a person to fix", () => {
    const hits = checkText("We optimize the color of your journey.\n\n## Build Your Best Week Ever\n\nIt was very good.");
    const messages = hits.map(h => h.message);
    expect(messages.some(m => m.includes("optimize"))).toBe(true);
    expect(messages.some(m => m.includes('US spelling "color"'))).toBe(true);
    expect(messages.some(m => m.includes('banned: "journey"'))).toBe(true);
    expect(messages.some(m => m.includes("Title Case"))).toBe(true);
    expect(messages.some(m => m.includes('filler adverb "very"'))).toBe(true);
  });

  it("passes the worked example", () => {
    const dir = path.resolve(import.meta.dirname, "../content/2026-11-23-no-off-season");
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      expect(checkText(fs.readFileSync(path.join(dir, f), "utf8")), f).toEqual([]);
    }
  });

  it("ignores hex colours, dates and sizes", () => {
    expect(checkText("Ivory #FAF9F5. Made 2026-11-23. Slides 1080 by 1350.")).toEqual([]);
  });
});

describe("model answers", () => {
  it("takes the JSON out of a fenced or chatty answer", () => {
    expect(parseJson<{ a: number }>('Here you go:\n```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(() => parseJson("no json here")).toThrow();
  });
});
