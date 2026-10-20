import { describe, expect, it } from "vitest";
import { fallbackAnalysis } from "./routers";

describe("fallback analysis when Gemini is out", () => {
  it("gives the scores and a promise, with no dashes in the words", () => {
    const text = fallbackAnalysis({ "sleep-hours": "7-8", "sleep-quality": "good", "stress-level": "sometimes", "training-frequency": "3-4", "nutrition-quality": "good", "energy-level": "steady" }, "Ann Smith");
    expect(text).toContain("Your scores, Ann");
    expect(text).toMatch(/out of 100/);
    expect(text).toContain("written analysis is on its way");
    // Markdown bullets ("- ") are list markers, not copy; the words carry no dash.
    const words = text.replace(/\*\*/g, "").replace(/^- /gm, "");
    expect(words).not.toMatch(/[–—]|\s-\s|\w-\w/);
  });
});
