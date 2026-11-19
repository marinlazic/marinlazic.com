// The quiz rules added after the 18 Nov 2026 funnel test: a real email is
// required, typing is kept to name and email, and wearable numbers are only
// asked of people who have a wearable.
import { describe, expect, it } from "vitest";
import {
  ALL_QUESTIONS,
  BASE_QUESTION_COUNT,
  QUESTIONS,
  RETIRED_QUESTIONS,
  isQuestionShown,
  isValidEmail,
} from "../shared/assessment";

describe("assessment quiz rules", () => {
  it("rejects an email that could never receive the report", () => {
    for (const bad of ["notanemail", "Test entry", "a@b", "a b@c.com", "@c.com", ""]) {
      expect(isValidEmail(bad), bad).toBe(false);
    }
    for (const good of ["a@b.co", " marin+smoke@marinlazic.coach ", "first.last@company.com.au"]) {
      expect(isValidEmail(good), good).toBe(true);
    }
  });

  it("asks for typing only for the name and the email", () => {
    const typed = QUESTIONS.filter(q => q.type === "text").map(q => q.id);
    expect(typed).toEqual(["name", "email"]);
  });

  it("no longer asks the written health questions, but still knows them", () => {
    const live = QUESTIONS.map(q => q.id);
    for (const id of ["goals-detail", "tried-before", "training-history", "injury-detail", "medications"]) {
      expect(live).not.toContain(id);
      expect(RETIRED_QUESTIONS.map(q => q.id)).toContain(id);
      expect(ALL_QUESTIONS.map(q => q.id)).toContain(id);
    }
  });

  it("asks for wearable numbers only when the person has a wearable", () => {
    const numbers = QUESTIONS.filter(q => q.type === "number");
    expect(numbers.map(q => q.id)).toEqual(["resting-heart-rate", "hrv", "respiratory-rate"]);
    for (const q of numbers) {
      expect(isQuestionShown(q, {})).toBe(false);
      expect(isQuestionShown(q, { "has-whoop": "no" })).toBe(false);
      expect(isQuestionShown(q, { "has-whoop": "yes" })).toBe(true);
      expect(isQuestionShown(q, { "has-whoop": "other-wearable" })).toBe(true);
      expect(q.min).toBeGreaterThan(0);
      expect(q.max).toBeGreaterThan(q.min!);
    }
  });

  it("counts 23 questions for someone without a wearable", () => {
    expect(BASE_QUESTION_COUNT).toBe(23);
    expect(QUESTIONS.filter(q => isQuestionShown(q, { "has-whoop": "no" }))).toHaveLength(23);
    expect(QUESTIONS.filter(q => isQuestionShown(q, { "has-whoop": "yes" }))).toHaveLength(26);
  });

  it("ends by asking what kind of help would suit, without scoring it", () => {
    const last = QUESTIONS[QUESTIONS.length - 1];
    expect(last.id).toBe("help-type");
    expect(last.options?.map(o => o.value)).toEqual(["program", "group", "one-to-one", "unsure"]);
    expect(last.options?.every(o => o.score === undefined)).toBe(true);
  });
});
