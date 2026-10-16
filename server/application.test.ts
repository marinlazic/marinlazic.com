import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    resendApiKey: "re_test_123456789",
    kitApiKey: "kit_test_123456789",
    resendFromEmail: "",
  },
}));

// Mock Resend
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Mock PDF (not needed for application but required by email module import)
vi.mock("./pdf", () => ({
  generateAssessmentPDF: vi.fn(),
}));

import { sendApplicationNotificationEmail, sendApplicantConfirmationEmail } from "./email";

describe("sendApplicationNotificationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends email to marin@marinlazic.coach with correct subject", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_app_1" }, error: null });

    await sendApplicationNotificationEmail({
      applicantName: "John Doe",
      applicantEmail: "john@example.com",
      q1_90day_goal: "Lose 5kg and improve energy",
      q2_obstacle: "Too busy with work",
      q3_investment: "yes",
      q4_anything_else: "I have a knee injury",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toEqual(["Marin@marinlazic.coach"]);
    expect(call.subject).toBe("Coaching Application: John Doe");
    expect(call.from).toContain("results@marinlazic.com");
  });

  it("sets reply-to to applicant email address", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_app_2" }, error: null });

    await sendApplicationNotificationEmail({
      applicantName: "Jane Smith",
      applicantEmail: "jane@company.com",
      q1_90day_goal: "Run a marathon",
      q2_obstacle: "No structured plan",
      q3_investment: "questions",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.replyTo).toBe("jane@company.com");
  });

  it("includes assessment data when provided", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_app_3" }, error: null });

    await sendApplicationNotificationEmail({
      applicantName: "Mike CEO",
      applicantEmail: "mike@startup.io",
      q1_90day_goal: "Better sleep and recovery",
      q2_obstacle: "Stress from fundraising",
      q3_investment: "yes",
      assessmentScore: 62,
      weakestArea: "sleep",
      primaryGoal: "improve-performance",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("62%");
    expect(call.html).toContain("sleep");
    expect(call.html).toContain("improve-performance");
  });

  it("includes all form answers in email body", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_app_4" }, error: null });

    await sendApplicationNotificationEmail({
      applicantName: "Test Applicant",
      applicantEmail: "test@test.com",
      q1_90day_goal: "Build muscle and improve VO2 max",
      q2_obstacle: "Travel schedule makes consistency hard",
      q3_investment: "no",
      q4_anything_else: "I travel 2 weeks per month",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("Build muscle and improve VO2 max");
    expect(call.html).toContain("Travel schedule makes consistency hard");
    expect(call.html).toContain("I travel 2 weeks per month");
  });

  it("returns false when RESEND_API_KEY is not configured", async () => {
    // Temporarily override env
    const envModule = await import("./_core/env");
    const originalKey = envModule.ENV.resendApiKey;
    (envModule.ENV as any).resendApiKey = "";

    const result = await sendApplicationNotificationEmail({
      applicantName: "No Key",
      applicantEmail: "nokey@test.com",
      q1_90day_goal: "Test",
      q2_obstacle: "Test",
      q3_investment: "yes",
    });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();

    // Restore
    (envModule.ENV as any).resendApiKey = originalKey;
  });
});

describe("sendApplicantConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends confirmation to applicant email", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_conf_1" }, error: null });

    await sendApplicantConfirmationEmail({
      applicantName: "Sarah Founder",
      applicantEmail: "sarah@company.com",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toEqual(["sarah@company.com"]);
  });

  it("has subject 'Got your application'", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_conf_2" }, error: null });

    await sendApplicantConfirmationEmail({
      applicantName: "Tom Executive",
      applicantEmail: "tom@corp.com",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toBe("Got your application");
  });

  it("sets reply-to to marin@marinlazic.coach", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_conf_3" }, error: null });

    await sendApplicantConfirmationEmail({
      applicantName: "Alex VC",
      applicantEmail: "alex@vc.fund",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.replyTo).toBe("marin@marinlazic.coach");
  });

  it("sends from results@marinlazic.com", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_conf_4" }, error: null });

    await sendApplicantConfirmationEmail({
      applicantName: "Chris Athlete",
      applicantEmail: "chris@sport.com",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.from).toContain("results@marinlazic.com");
  });

  it("mentions 24-hour reply in body", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_conf_5" }, error: null });

    await sendApplicantConfirmationEmail({
      applicantName: "Dana",
      applicantEmail: "dana@example.com",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("24 hours");
  });

  it("uses first name in greeting", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_conf_6" }, error: null });

    await sendApplicantConfirmationEmail({
      applicantName: "Benjamin Franklin",
      applicantEmail: "ben@example.com",
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("Hi Benjamin");
  });

  it("returns false when RESEND_API_KEY is not configured", async () => {
    const envModule = await import("./_core/env");
    const originalKey = envModule.ENV.resendApiKey;
    (envModule.ENV as any).resendApiKey = "";

    const result = await sendApplicantConfirmationEmail({
      applicantName: "No Key",
      applicantEmail: "nokey@test.com",
    });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();

    (envModule.ENV as any).resendApiKey = originalKey;
  });
});
