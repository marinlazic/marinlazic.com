import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  createLead: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([
    {
      id: 1,
      email: "test@example.com",
      source: "direct",
      status: "new",
      notes: null,
      createdAt: new Date("2026-01-15"),
      updatedAt: new Date("2026-01-15"),
    },
  ]),
  getReportTokensByEmails: vi.fn().mockResolvedValue(new Map()),
  getLatestLeadByEmail: vi.fn().mockResolvedValue(null),
  updateLeadStatus: vi.fn().mockResolvedValue(undefined),
  getLeadStats: vi.fn().mockResolvedValue({
    total: 5,
    byStatus: { new: 3, contacted: 1, converted: 1 },
    daily: [{ date: "2026-01-15", count: 2 }],
  }),
  trackEvent: vi.fn().mockResolvedValue(undefined),
  getAnalyticsStats: vi.fn().mockResolvedValue({
    eventsByType: [
      { eventType: "page_view", count: 100 },
      { eventType: "cta_click", count: 10 },
    ],
    dailyEvents: [
      { date: "2026-01-15", eventType: "page_view", count: 50 },
    ],
  }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      ip: "127.0.0.1",
      protocol: "https",
      headers: {
        "user-agent": "test-agent",
        referer: "https://marinlazic.com",
      },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "marin@marinlazic.coach",
      name: "Marin Lazic",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      ip: "127.0.0.1",
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      ip: "127.0.0.1",
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("leads.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a valid email submission", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      email: "prospect@example.com",
      source: "google",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects an invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});

describe("leads.list (admin only)", () => {
  it("returns leads for admin users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const leads = await caller.leads.list({});
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);
    expect(leads[0].email).toBe("test@example.com");
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.list({})).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.leads.list({})).rejects.toThrow();
  });
});

describe("leads.updateStatus (admin only)", () => {
  it("updates lead status for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.leads.updateStatus({
      id: 1,
      status: "contacted",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.leads.updateStatus({ id: 1, status: "contacted" })
    ).rejects.toThrow();
  });
});

describe("leads.stats (admin only)", () => {
  it("returns stats for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.leads.stats();
    expect(stats.total).toBe(5);
    expect(stats.byStatus.new).toBe(3);
  });
});

describe("coaching application via leads.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a coaching application with source coaching-application", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      email: "applicant@example.com",
      name: "Dan Presly",
      source: "coaching-application",
      message: "COACHING APPLICATION ($1,500/mo)\n\nWhy they want coaching: I want to improve my energy and performance.",
    });
    expect(result).toEqual({ success: true });
  });

  it("accepts a coaching application without optional message", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      email: "applicant2@example.com",
      name: "Jane Smith",
      source: "coaching-application",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("analytics.track", () => {
  it("tracks an event from public user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.analytics.track({
      eventType: "page_view",
      eventData: JSON.stringify({ section: "hero" }),
      sessionId: "test-session",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("analytics.stats (admin only)", () => {
  it("returns analytics stats for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.analytics.stats({ days: 30 });
    expect(stats.eventsByType.length).toBeGreaterThan(0);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.analytics.stats({ days: 30 })).rejects.toThrow();
  });
});
