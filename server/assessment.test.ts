import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "test-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "## Your Performance Profile\n\nTest analysis content for the assessment.\n\n### Sleep Analysis\n\nYour sleep needs work.\n\n### The Bottom Line\n\nYou need coaching.",
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the email module
vi.mock("./email", () => ({
  sendAssessmentResultsEmail: vi.fn().mockResolvedValue(true),
  sendApplicationNotificationEmail: vi.fn().mockResolvedValue(true),
  sendAssessmentNotificationEmail: vi.fn().mockResolvedValue(true),
}));

// Mock the db module
vi.mock("./db", () => ({
  createLead: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([]),
  updateLeadStatus: vi.fn().mockResolvedValue(undefined),
  getLeadStats: vi.fn().mockResolvedValue({ total: 0, byStatus: {}, daily: [] }),
  trackEvent: vi.fn().mockResolvedValue(undefined),
  getAnalyticsStats: vi.fn().mockResolvedValue({ eventsByType: [], dailyEvents: [] }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const sampleAnswers: Record<string, string | string[]> = {
  name: "Test User",
  email: "test@example.com",
  age: "35-44",
  occupation: "executive",
  "primary-goal": "energy",
  "goals-detail": "I want to have more energy throughout the day",
  "tried-before": "Various gym programs",
  "sleep-hours": "6-7",
  "sleep-quality": "average",
  "sleep-routine": "sometimes",
  "stress-level": "most-days",
  "stress-management": "aware",
  "mental-health": "scattered",
  "training-frequency": "3",
  "training-type": ["strength", "cardio"],
  "training-structure": "loose",
  "training-history": "10 years of gym on and off",
  "current-injuries": "minor",
  "injury-detail": "Occasional lower back pain",
  "medications": "None",
  "nutrition-quality": "average",
  "energy-level": "dip",
  hydration: "1-2",
  "recovery-practice": "occasional",
  "has-whoop": "no",
  "after-work-energy": "depends",
  commitment: "ready",
};

describe("assessment.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts assessment answers and returns analysis", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assessment.submit({
      answers: sampleAnswers,
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("analysis");
    expect(typeof result.analysis).toBe("string");
    expect(result.analysis.length).toBeGreaterThan(0);
  });

  it("saves lead to database with email and name", async () => {
    const { createLead } = await import("./db");
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.assessment.submit({ answers: sampleAnswers });

    expect(createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        name: "Test User",
        source: "performance-assessment-v2",
      })
    );
  });

  it("notifies owner with lead details via email", async () => {
    const { sendAssessmentNotificationEmail } = await import("./email");
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.assessment.submit({ answers: sampleAnswers });

    expect(sendAssessmentNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "test@example.com",
      })
    );
  });

  it("includes assessment source and answer summary in lead message", async () => {
    const { createLead } = await import("./db");
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.assessment.submit({ answers: sampleAnswers });

    const callArg = (createLead as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.source).toBe("performance-assessment-v2");
    expect(callArg.message).toContain("email: test@example.com");
    expect(callArg.message).toContain("primary-goal: energy");
  });

  it("handles missing optional fields gracefully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const minimalAnswers = {
      name: "Minimal",
      email: "minimal@test.com",
      "sleep-hours": "7-8",
    };

    const result = await caller.assessment.submit({ answers: minimalAnswers });
    expect(result.success).toBe(true);
    expect(result.analysis).toBeTruthy();
  });
});
