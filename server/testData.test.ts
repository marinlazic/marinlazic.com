import { afterEach, describe, expect, it, vi } from "vitest";
import { isTestEmail } from "../shared/testData";

describe("test addresses", () => {
  it("recognises the smoke test pattern and nothing else", () => {
    expect(isTestEmail("marin+smoke@marinlazic.coach")).toBe(true);
    expect(isTestEmail("Marin+SMOKE@marinlazic.com")).toBe(true);
    expect(isTestEmail("marin+test2@marinlazic.coach")).toBe(true);
    expect(isTestEmail("marin+e2etest@marinlazic.coach")).toBe(true);
    expect(isTestEmail("manus.emailfix.test.1781146147271@marinlazic.com")).toBe(true);
    expect(isTestEmail("rwedvwlc@sharklasers.com")).toBe(true);
    expect(isTestEmail("ellemeredith+mindbody@gmail.com")).toBe(false);
    expect(isTestEmail("marin@marinlazic.coach")).toBe(false);
    expect(isTestEmail("smoke@example.com")).toBe(false);
    expect(isTestEmail("")).toBe(false);
    expect(isTestEmail(null)).toBe(false);
  });
});

describe("Kit and test addresses", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("never sends a test address to Kit", async () => {
    process.env.KIT_API_KEY = "test-key";
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => { calls.push(String(url)); return new Response("{}", { status: 200 }); }));
    const kit = await import("./kit");
    kit.kitOnEnquiry("marin+smoke@marinlazic.coach", "Smoke Test");
    kit.kitOnEmailCapture("marin+smoke@marinlazic.coach", "Smoke Test");
    await kit.flushKit();
    expect(calls).toEqual([]);
  });

  it("untags and unsubscribes a test subscriber", async () => {
    process.env.KIT_API_KEY = "test-key";
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const path = String(url).replace("https://api.kit.com/v4", "");
      calls.push(`${init?.method ?? "GET"} ${path}`);
      if (path.startsWith("/subscribers?email_address=")) return Response.json({ subscribers: [{ id: 77, state: "active" }] });
      if (path.startsWith("/subscribers/77/tags")) return Response.json({ tags: [{ id: 1, name: "assessment-started" }, { id: 2, name: "enquiry" }] });
      return Response.json({});
    }));
    const { kitForgetSubscriber } = await import("./kit");
    const summary = await kitForgetSubscriber("marin+smoke@marinlazic.coach");
    expect(summary).toBe("2 tags removed, unsubscribed");
    expect(calls).toContain("DELETE /tags/1/subscribers/77");
    expect(calls).toContain("DELETE /tags/2/subscribers/77");
    expect(calls).toContain("POST /subscribers/77/unsubscribe");
    await expect(kitForgetSubscriber("real@example.com")).rejects.toThrow(/test addresses/);
  });
});

describe.skipIf(!process.env.DATABASE_URL)("purgeTestData against the database", () => {
  it("removes smoke rows and keeps everyone else", async () => {
    const { getDb } = await import("./db");
    const { leads, assessmentProgress, assessmentReports, emailLog, applications } = await import("../drizzle/schema");
    const { purgeTestData } = await import("./testData");
    const { sql } = await import("drizzle-orm");
    const d = (await getDb())!;
    const smoke = "marin+smoke@marinlazic.coach";
    const real = `keep-${Date.now()}@example.com`;
    await d.insert(leads).values([{ email: smoke, name: "Smoke Test", source: "smoke-test" }, { email: real, name: "Real Person", source: "direct" }]);
    await d.insert(assessmentProgress).values([{ email: smoke, resumeToken: `t-${Date.now()}-a` }, { email: real, resumeToken: `t-${Date.now()}-b` }]);
    await d.insert(assessmentReports).values({ token: `r-${Date.now()}`, email: smoke, answers: {}, scores: {}, analysis: "x", expiresAt: new Date(Date.now() + 86_400_000) });
    await d.insert(applications).values({ name: "Smoke Test", email: smoke, q1_90day_goal: "a", q2_obstacle: "b", q3_investment: "c" });
    await d.insert(emailLog).values([{ toEmail: smoke, kind: "enquiry_confirmation", subject: "s" }, { toEmail: real, kind: "enquiry_confirmation", subject: "s" }]);

    const r = await purgeTestData();
    expect(r.emails).toEqual([smoke]);
    expect(r.leads).toBeGreaterThanOrEqual(1);
    expect(r.progress).toBeGreaterThanOrEqual(1);
    expect(r.reports).toBeGreaterThanOrEqual(1);
    expect(r.applications).toBeGreaterThanOrEqual(1);
    expect(r.emailLog).toBeGreaterThanOrEqual(1);

    const left = (await d.execute(sql`SELECT count(*) AS c FROM leads WHERE lower(email) LIKE '%+smoke@%'`)) as any;
    expect(Number((left.rows ?? left)[0].c)).toBe(0);
    const kept = (await d.execute(sql`SELECT count(*) AS c FROM leads WHERE email = ${real}`)) as any;
    expect(Number((kept.rows ?? kept)[0].c)).toBe(1);
    await d.execute(sql`DELETE FROM leads WHERE email = ${real}`);
    await d.execute(sql`DELETE FROM assessment_progress WHERE email = ${real}`);
    await d.execute(sql`DELETE FROM email_log WHERE to_email = ${real}`);
  });
});
