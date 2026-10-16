import { describe, it, expect } from "vitest";
import { calculateScores, getScoreLabel, getScoreColour, getSolutions, getCategorySummary, buildPdfHtml, buildRadarSvg } from "./pdf";

describe("calculateScores", () => {
  it("returns 0 for empty answers", () => {
    const { categories, overallPct } = calculateScores({});
    expect(overallPct).toBe(0);
    expect(categories).toHaveLength(6);
    categories.forEach((c) => expect(c.percentage).toBe(0));
  });

  it("calculates perfect scores", () => {
    const answers = {
      "sleep-hours": "8+",
      "sleep-quality": "excellent",
      "sleep-routine": "locked-in",
      "stress-level": "never",
      "stress-management": "daily",
      "mental-clarity": "sharp",
      "training-frequency": "daily",
      "training-type": "programmed",
      "training-intensity": "periodised",
      "current-injuries": "none",
      "nutrition-quality": "dialled",
      "energy-level": "high",
      hydration: "excellent",
      "recovery-practices": "comprehensive",
      "recovery-quality": "excellent",
    };
    const { categories, overallPct } = calculateScores(answers);
    expect(overallPct).toBe(100);
    categories.forEach((c) => expect(c.percentage).toBe(100));
  });

  it("calculates mixed scores correctly", () => {
    const answers = {
      "sleep-hours": "7-8",
      "sleep-quality": "good",
      "sleep-routine": "mostly",
      "stress-level": "few-times",
      "stress-management": "reactive",
      "training-frequency": "5-6",
    };
    const { categories, overallPct } = calculateScores(answers);
    expect(overallPct).toBeGreaterThan(0);
    expect(overallPct).toBeLessThan(100);

    const sleep = categories.find((c) => c.id === "sleep");
    expect(sleep?.percentage).toBe(80);
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
  it("returns green for 60+", () => {
    expect(getScoreColour(65)).toBe("#4A7C59");
  });
  it("returns olive for 50-59", () => {
    expect(getScoreColour(55)).toBe("#8B7D3C");
  });
  it("returns red for below 50", () => {
    expect(getScoreColour(40)).toBe("#C8102E");
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
    overallLabel: "NEEDS WORK",
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

  it("includes the user name in uppercase on page 1", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("TEST USER");
  });

  it("includes the overall score and label", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("58");
    expect(html).toContain("NEEDS WORK");
  });

  it("includes QUESTIONNAIRE COACHING SCORE section", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("QUESTIONNAIRE COACHING SCORE");
  });

  it("includes score context without a recovery projection", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Score Context");
    expect(html).toContain("does not predict a health outcome or a recovery timeline");
  });

  it("includes radar chart (FIG. 01)", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("FIG. 01");
    expect(html).toContain("PERFORMANCE RADAR");
    expect(html).toContain("<svg");
  });

  it("includes domain bars (FIG. 02)", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("FIG. 02");
    expect(html).toContain("DOMAIN SCORES");
    expect(html).toContain("domain-bar-fill");
  });

  it("includes ACTION PLAN page with protocols", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("ACTION PLAN");
    expect(html).toContain("Six focus areas");
    expect(html).toContain("Choose what fits your week");
    expect(html).toContain("Get more sleep");
    expect(html).toContain("Meditate daily");
  });

  it("includes COACH ANALYSIS page", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("COACH ANALYSIS");
    expect(html).toContain("questionnaire responses");
    expect(html).toContain("THE 30-SECOND READ");
    expect(html).toContain("TOP 5 ACTIONS");
  });

  it("includes CTA page with coaching details", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("NEXT STEP");
    expect(html).toContain("Turn insight into");
    expect(html).toContain("1:1 COACHING");
    expect(html).toContain("$2,400 AUD / MONTH");
    expect(html).toContain("Bridge Athletic");
    expect(html).toContain("marin@marinlazic.coach");
    expect(html).toContain("APPLY FOR COACHING");
  });

  it("includes report ID with correct format", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toMatch(/ML-PRF-\d{6}-TU/);
  });

  it("includes Google Fonts link for Inter", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("fonts.googleapis.com");
    expect(html).toContain("Inter");
  });

  it("includes page numbers P. 01-04", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("P. 01 / 04");
    expect(html).toContain("P. 02 / 04");
    expect(html).toContain("P. 03 / 04");
    expect(html).toContain("P. 04 / 04");
  });

  it("includes strongest and priority domain stats", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("Strongest Domain");
    expect(html).toContain("Priority Domain");
    expect(html).toContain("Illustrative Reference");
  });

  it("shows the shared non-clinical scope note", () => {
    const html = buildPdfHtml(baseParams);
    expect(html).toContain("This questionnaire coaching score reflects self-reported answers");
    expect(html).toContain("It is not medical advice or a diagnosis");
    expect(html).toContain("persistent fatigue, pain, or sleep problems");
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
