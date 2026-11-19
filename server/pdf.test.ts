import { describe, it, expect } from "vitest";
import { calculateScores, getScoreLabel, getScoreColour, getSolutions, getCategorySummary, buildPdfHtml, buildRadarSvg } from "./pdf";
import { BASE_QUESTION_COUNT, QUESTIONS, calculateScores as sharedCalculateScores, getResponseLabel } from "../shared/assessment";

describe("calculateScores", () => {
  it("returns 0 for empty answers", () => {
    const { categories, overallPct } = calculateScores({});
    expect(overallPct).toBe(0);
    expect(categories).toHaveLength(6);
    categories.forEach((c) => expect(c.percentage).toBe(0));
  });

  it("calculates perfect scores from the real question options", () => {
    const answers: Record<string, string> = {};
    for (const q of QUESTIONS) {
      const best = q.options?.filter(o => o.score !== undefined).sort((a, b) => b.score! - a.score!)[0];
      if (best) answers[q.id] = best.value;
    }
    const { categories, overallPct } = calculateScores(answers);
    expect(overallPct).toBe(100);
    categories.forEach((c) => expect(c.percentage).toBe(100));
  });

  it("scores the same way the screen does (shared function)", () => {
    const answers: Record<string, string> = {};
    for (const q of QUESTIONS) {
      const opts = q.options?.filter(o => o.score !== undefined);
      if (opts?.length) answers[q.id] = opts[Math.min(1, opts.length - 1)].value;
    }
    const pdf = calculateScores(answers);
    const shared = sharedCalculateScores(answers);
    expect(pdf.overallPct).toBe(shared.overallPct);
    expect(pdf.overallPct).toBeGreaterThan(0);
    expect(pdf.overallPct).toBeLessThan(100);
    pdf.categories.forEach((c, i) => expect(c.percentage).toBe(shared.categories[i].percentage));
  });

  it("handles unknown answer values gracefully", () => {
    const answers = { "sleep-hours": "unknown-value" };
    const { overallPct } = calculateScores(answers);
    expect(overallPct).toBe(0);
  });
});

describe("getScoreLabel", () => {
  it("returns correct labels for score ranges", () => {
    expect(getScoreLabel(85)).toBe("STRONG HABITS");
    expect(getScoreLabel(65)).toBe("STEADY BASE");
    expect(getScoreLabel(55)).toBe("FOCUS AREA");
    expect(getScoreLabel(35)).toBe("STARTING POINT");
  });
});

describe("getScoreColour", () => {
  it("uses the same dot colours as the results page", () => {
    for (const pct of [10, 39, 40, 59, 60, 79, 80, 100]) {
      expect(getScoreColour(pct)).toBe(getResponseLabel(pct).color);
    }
    expect(getResponseLabel(85).label).toBe("More consistent responses");
    expect(getResponseLabel(65).label).toBe("Some consistent responses");
    expect(getResponseLabel(45).label).toBe("Mixed responses");
    expect(getResponseLabel(20).label).toBe("Areas to review");
  });
  it("never returns the old red", () => {
    for (let pct = 0; pct <= 100; pct += 5) expect(getScoreColour(pct)).not.toMatch(/C8102E/i);
  });
});

describe("getCategorySummary", () => {
  it("returns different summaries based on score level", () => {
    const high = getCategorySummary("sleep", 70);
    const mid = getCategorySummary("sleep", 55);
    const low = getCategorySummary("sleep", 30);
    expect(high).not.toBe(mid);
    expect(mid).not.toBe(low);
  });
});

describe("getSolutions", () => {
  it("returns solutions for all 6 categories", () => {
    const solutions = getSolutions({});
    expect(Object.keys(solutions)).toHaveLength(6);
    expect(solutions.sleep.length).toBeGreaterThan(0);
    expect(solutions.stress.length).toBeGreaterThan(0);
    expect(solutions.training.length).toBeGreaterThan(0);
    expect(solutions.injuries.length).toBeGreaterThan(0);
    expect(solutions.nutrition.length).toBeGreaterThan(0);
    expect(solutions.recovery.length).toBeGreaterThan(0);
  });

  it("suggests qualified guidance for reported injuries", () => {
    const solutions = getSolutions({
      "current-injuries": "moderate",
      "injury-detail": "Bad lower left back",
    });
    expect(solutions.injuries.some((s) => s.toLowerCase().includes("qualified clinician"))).toBe(true);
  });

  it("recommends WHOOP when user doesn't have one", () => {
    const solutions = getSolutions({ "has-whoop": "no" });
    const whoopSolution = solutions.recovery.find((s) => s.includes("WHOOP"));
    expect(whoopSolution).toBeDefined();
  });

  it("provides sleep solutions for poor sleep hours", () => {
    const solutions = getSolutions({ "sleep-hours": "under-5" });
    expect(solutions.sleep.length).toBeGreaterThanOrEqual(2);
    expect(solutions.sleep.some((s) => s.includes("30 minutes"))).toBe(true);
  });

  it("provides training structure solutions for loose training", () => {
    const solutions = getSolutions({ "training-structure": "loose" });
    expect(solutions.training.some((s) => s.toLowerCase().includes("track sessions"))).toBe(true);
  });

  it("provides nutrition solutions for average nutrition", () => {
    const solutions = getSolutions({ "nutrition-quality": "average" });
    expect(solutions.nutrition.some((s) => s.toLowerCase().includes("protein"))).toBe(true);
  });

  it("provides flexible hydration guidance for moderate hydration", () => {
    const solutions = getSolutions({ hydration: "moderate" });
    expect(solutions.nutrition.some((s) => s.toLowerCase().includes("drink to thirst"))).toBe(true);
  });

  it("reads the quiz's current answer values", () => {
    const lowest: Record<string, string | string[]> = {};
    for (const q of QUESTIONS) {
      const worst = q.options?.filter(o => o.score !== undefined).sort((a, b) => a.score! - b.score!)[0];
      if (worst) lowest[q.id] = worst.value;
    }
    lowest["training-type"] = ["cardio"];
    const s = getSolutions(lowest);
    // Nobody who scored lowest should be told their habits are working.
    for (const list of Object.values(s)) {
      for (const line of list) expect(line).not.toMatch(/^Your answers describe/);
    }
    expect(s.injuries.join(" ")).not.toContain("No current injury was selected");
    expect(s.injuries.some(l => l.toLowerCase().includes("qualified clinician"))).toBe(true);
    expect(s.training.some(l => l.toLowerCase().includes("weekly training plan"))).toBe(true);
    expect(s.training.some(l => l.toLowerCase().includes("resistance work"))).toBe(true);
    expect(s.nutrition.some(l => l.toLowerCase().includes("energy dips"))).toBe(true);
    expect(s.nutrition.some(l => l.toLowerCase().includes("drink to thirst"))).toBe(true);
    expect(s.recovery.length).toBeGreaterThanOrEqual(3);
  });

  it("only says no injury was selected at a full injuries score", () => {
    expect(getCategorySummary("injuries", 100)).toContain("No current issue was selected");
    expect(getCategorySummary("injuries", 80)).not.toContain("No current issue was selected");
  });

  it("provides stress solutions for reactive management", () => {
    const solutions = getSolutions({ "stress-management": "reactive" });
    expect(solutions.stress.some((s) => s.toLowerCase().includes("reflection"))).toBe(true);
  });
});

describe("buildRadarSvg", () => {
  it("generates valid SVG with polygon and labels", () => {
    const { categories } = calculateScores({
      "sleep-hours": "7-8",
      "sleep-quality": "good",
      "sleep-routine": "mostly",
      "stress-level": "few-times",
      "stress-management": "reactive",
      "mental-clarity": "morning-only",
      "training-frequency": "3-4",
      "training-type": "mixed",
      "training-intensity": "moderate",
      "current-injuries": "moderate",
      "nutrition-quality": "average",
      "energy-level": "average",
      hydration: "moderate",
      "recovery-practices": "basic",
      "recovery-quality": "average",
    });
    const svg = buildRadarSvg(categories);
    expect(svg).toContain("<svg");
    expect(svg).toContain("polygon");
    expect(svg).toContain("Sleep");
    expect(svg).toContain("circle");
  });
});

describe("buildPdfHtml", () => {
  const baseParams = {
    name: "Test User",
    analysis: "## Sleep\n\nYour sleep is the biggest bottleneck.\n\n## Stress & Mental\n\nDaily stress without proactive management.",
    answers: {},
    categories: [
      { name: "Sleep", id: "sleep", percentage: 80 },
      { name: "Stress & Mental", id: "stress", percentage: 60 },
      { name: "Training", id: "training", percentage: 70 },
      { name: "Injuries & Health", id: "injuries", percentage: 40 },
      { name: "Nutrition & Energy", id: "nutrition", percentage: 55 },
      { name: "Recovery", id: "recovery", percentage: 45 },
    ],
    overallPct: 58,
    overallLabel: "FOCUS AREA",
    overallColour: "#8B7D3C",
    solutions: {
      sleep: ["Get more sleep"],
      stress: ["Meditate daily"],
      training: ["Add structure"],
      injuries: ["See a physio"],
      nutrition: ["Eat more protein"],
      recovery: ["Get a WHOOP"],
    },
  };

  it("opens with the name, like the results page", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Test's performance profile");
    expect(html).toContain("For Test User");
  });

  it("falls back to a plain headline when no name was given", () => {
    const html = buildPdfHtml({ ...baseParams, name: "Your Results" });
    expect(html).toContain("<h1>Your performance profile</h1>");
    expect(html).not.toContain("For Your Results");
  });

  it("escapes the name", () => {
    const html = buildPdfHtml({ ...baseParams, name: "<b>Sam</b> O'Neil" });
    expect(html).not.toContain("<b>Sam</b>");
    expect(html).toContain("&lt;b&gt;Sam&lt;/b&gt;");
  });

  it("shows the overall score with the same words as the results page", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain('<span class="num">58</span>');
    expect(html).toContain("out of 100");
    expect(html).toContain("Mixed responses");
  });

  it("includes score context without a recovery projection", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Score context.");
    expect(html).toContain("does not predict a health outcome or a recovery timeline");
  });

  it("includes the radar and the category scores", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Performance radar");
    expect(html).toContain("<svg");
    expect(html).toContain("Category scores");
    expect(html).toContain("domain-bar-fill");
  });

  it("marks only the lowest area with the signal colour", () => {
    const html = buildPdfHtml(baseParams);
    // Injuries & Health is lowest at 40.
    expect(html).toContain('style="width:40%;background:#FF5A36"');
    expect(html).toContain('style="width:80%;background:#141413"');
    expect(html).not.toContain("width:45%;background:#FF5A36");
  });

  it("uses the site colours and none of the old red", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("#FAF9F5");
    expect(html).toContain("#141413");
    expect(html).not.toMatch(/C8102E/i);
  });

  it("includes the action plan page", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Action plan");
    expect(html).toContain("Six focus areas. Choose what fits your week.");
    expect(html).toContain("Get more sleep");
    expect(html).toContain("Meditate daily");
  });

  it("includes the coach analysis page", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Coach analysis");
    expect(html).toContain("questionnaire responses");
    expect(html).toContain("The 30 second read");
    expect(html).toContain("Top 5 actions for the next 30 days");
    expect(html).toContain("Your sleep is the biggest bottleneck.");
  });

  it("finds each area in the written analysis by its heading", () => {
    const html = buildPdfHtml({
      ...baseParams,
      analysis:
        "## Your Performance Profile\n\nA long enough opening paragraph that reads as the thirty second summary of the report.\n\n### Sleep Analysis\nSleep text here.\n\n### Injury & Health Considerations\nInjury text here.\n\n### Recovery Profile\nRecovery text here.\n\n### The Bottom Line\nClosing text.",
    });
    expect(html).toContain('<div class="analysis-text">Sleep text here.</div>');
    expect(html).toContain('<div class="analysis-text">Injury text here.</div>');
    expect(html).toContain('<div class="analysis-text">Recovery text here.</div>');
  });

  it("includes the next step page with the same coaching list as the site", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Next step");
    expect(html).toContain("Turn insight into your next action.");
    expect(html).toContain("What coaching with me includes");
    expect(html).toContain("Monthly, 3 month minimum");
    expect(html).toContain("Apply for coaching");
    expect(html).toContain("marinlazic.com/apply");
    expect(html).toContain("marin@marinlazic.coach");
    expect(html).not.toMatch(/limited spots/i);
  });

  it("includes report ID with correct format", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toMatch(/ML-PRF-\d{6}-TU/);
  });

  it("loads DM Sans and Inter, the site fonts", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("fonts.googleapis.com");
    expect(html).toContain("DM+Sans");
    expect(html).toContain("Inter");
  });

  it("numbers the four pages", () => {
    const html = buildPdfHtml(baseParams);
    for (const n of [1, 2, 3, 4]) expect(html).toContain(`Page ${n} of 4`);
  });

  it("names the strongest area and the biggest opportunity", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Strongest area");
    expect(html).toContain("Biggest opportunity");
  });

  it("counts the questions that were asked", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain(`${BASE_QUESTION_COUNT} questions`);
    expect(html).not.toContain("ITEM SURVEY");
  });

  it("shows the shared scope note on every page", () => {
    const html = buildPdfHtml(baseParams);
    expect(html.split("This questionnaire coaching score reflects self reported answers").length - 1).toBe(4);
    expect(html).toContain("It is not medical advice or a diagnosis");
    expect(html).toContain("persistent fatigue, pain, or sleep problems");
  });

  it("has no dashes in the words people read", () => {
    const lowest: Record<string, string> = {};
    for (const q of QUESTIONS) {
      const worst = q.options?.filter(o => o.score !== undefined).sort((a, b) => a.score! - b.score!)[0];
      if (worst) lowest[q.id] = worst.value;
    }
    for (const id of ["sleep", "stress", "training", "injuries", "nutrition", "recovery"]) {
      for (const pct of [20, 55, 80, 100]) expect(getCategorySummary(id, pct)).not.toMatch(/[A-Za-z]-[A-Za-z]/);
    }
    for (const answers of [{}, lowest, { ...lowest, "has-whoop": "no" }]) {
      for (const list of Object.values(getSolutions(answers))) {
        for (const line of list) expect(line).not.toMatch(/[A-Za-z]-[A-Za-z]|[\u2013\u2014]/);
      }
    }
    const html = buildPdfHtml({ ...baseParams, solutions: getSolutions(lowest) });
    const text = html
      .replace(/<style[\s\S]*?<\/style>/g, "")
      .replace(/<svg[\s\S]*?<\/svg>/g, "")
      .replace(/<[^>]+>/g, " ")
      // The report ID and web addresses keep theirs.
      .replace(/ML-PRF-\d{6}-[A-Z]*/g, "")
      .replace(/marinlazic\.com\/\S*/g, "");
    expect(text).not.toMatch(/[\u2013\u2014]/);
    expect(text).not.toMatch(/[A-Za-z]-[A-Za-z]/);
  });
});

describe("generateAssessmentPDF", () => {
  it("generates a valid PDF buffer", async () => {
    const { generateAssessmentPDF } = await import("./pdf");
    const buffer = await generateAssessmentPDF({
      name: "Test User",
      analysis: "## Sleep\n\nSleep is good.\n\n## Stress & Mental\n\nStress is manageable.",
      answers: {
        "sleep-hours": "7-8",
        "sleep-quality": "good",
        "sleep-routine": "mostly",
        "stress-level": "few-times",
        "stress-management": "reactive",
        "mental-clarity": "morning-only",
        "training-frequency": "3-4",
        "training-type": "mixed",
        "training-intensity": "moderate",
        "current-injuries": "moderate",
        "injury-detail": "Bad lower back",
        "nutrition-quality": "average",
        "energy-level": "average",
        hydration: "moderate",
        "recovery-practices": "basic",
        "recovery-quality": "average",
        "has-whoop": "no",
      },
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF magic bytes
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");
  }, 30000);
});
