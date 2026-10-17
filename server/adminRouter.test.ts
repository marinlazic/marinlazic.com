import { describe, expect, it } from "vitest";
import { answersFromMessage, labelAnswer, leadKind } from "./adminRouter";
import { calculateScores } from "../shared/assessment";

describe("admin dashboard helpers", () => {
  it("classifies leads by source", () => {
    expect(leadKind("performance-assessment-v2")).toBe("assessment");
    expect(leadKind("coaching-application")).toBe("application");
    expect(leadKind("stripe-purchase")).toBe("purchase");
    expect(leadKind("corporate-enquiry")).toBe("enquiry");
    expect(leadKind("https://www.linkedin.com/")).toBe("enquiry");
    expect(leadKind(null)).toBe("enquiry");
  });

  it("recovers assessment answers from an old lead message and scores them", () => {
    const message =
      "name: Patrick | email: p@example.com | age: under-25 | occupation: athlete | sleep-hours: 8+ | sleep-quality: excellent | sleep-routine: inconsistent | stress-level: rarely | stress-management: reactive | mental-health: good | training-frequency: 6+ | training-type: sport, swimming, strength | training-structure: periodised | current-injuries: minor | nutrition-quality: good | energy-level: dip | hydration: 3+ | recovery-practice: regular | has-whoop: other-wearable | after-work-energy: usually | commitment: ready";
    const answers = answersFromMessage(message);
    expect(answers.name).toBeUndefined();
    expect(answers.email).toBeUndefined();
    expect(answers["sleep-hours"]).toBe("8+");
    expect(answers["training-type"]).toEqual(["sport", "swimming", "strength"]);
    const scores = calculateScores(answers);
    expect(scores.overallPct).toBeGreaterThan(0);
    expect(scores.categories.some(c => c.max > 0)).toBe(true);
  });

  it("ignores messages that are not answer sets", () => {
    expect(answersFromMessage("Hi Marin, keen to chat about coaching")).toEqual({});
    expect(answersFromMessage(null)).toEqual({});
  });

  it("labels answers with the question text and option label", () => {
    const labelled = labelAnswer("sleep-hours", "8+");
    expect(labelled.question.length).toBeGreaterThan(5);
    expect(labelled.answer).not.toBe("8+");
    expect(labelled.section).toBe("sleep");
    expect(labelAnswer("unknown-question", "x")).toEqual({ question: "unknown-question", answer: "x", section: "other" });
  });
});
