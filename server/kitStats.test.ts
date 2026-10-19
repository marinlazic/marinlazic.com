import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.KIT_API_KEY = "test-key";

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

function fakeKit(url: string): Response {
  const path = url.replace("https://api.kit.com/v4", "");
  if (path === "/account") return json({ account: { name: "Marin Lazic", plan_type: "creator", timezone: { name: "Australia/Sydney" } } });
  if (path.startsWith("/account/growth_stats")) return json({ stats: { cancellations: 2, net_new_subscribers: 7, new_subscribers: 9, subscribers: 120, starting: "2026-09-19", ending: "2026-10-19" } });
  if (path === "/account/email_stats") return json({ stats: { sent: 300, opened: 150, clicked: 30, open_rate: 50, click_rate: 10, unsubscribe_rate: 1, bounce_rate: 0.5, open_tracking_enabled: true, click_tracking_enabled: true, starting: "2026-07-21", ending: "2026-10-19", email_stats_mode: "last_90" } });
  if (path.startsWith("/subscribers?status=active")) return json({ subscribers: [], pagination: { total_count: 120 } });
  if (path.startsWith("/subscribers?status=cancelled")) return json({ subscribers: [], total_count: 14 });
  if (path.startsWith("/subscribers?status=bounced")) return json({ subscribers: [], pagination: {} });
  if (path.startsWith("/subscribers?status=all")) return json({ subscribers: [{ id: 9, email_address: "a@example.com", first_name: "Ann", state: "active", created_at: "2026-10-18T00:00:00Z", tags: [{ id: 1, name: "assessment-completed" }], attribution: { source_name: "Assessment" } }] });
  if (path.startsWith("/tags?")) return json({ tags: [{ id: 1, name: "assessment-completed" }, { id: 2, name: "assessment-started" }, { id: 3, name: "newsletter" }] });
  if (path.startsWith("/tags/1/")) return json({ subscribers: [], pagination: { total_count: 27 } });
  if (path.startsWith("/tags/2/")) return json({ subscribers: [], pagination: { total_count: 38 } });
  if (path.startsWith("/tags/3/")) return json({ subscribers: [], pagination: { total_count: 80 } });
  if (path.startsWith("/broadcasts/stats")) return json({ broadcasts: [{ id: 5, subject: "October note", send_at: "2026-10-10T09:00:00Z", stats: { recipients: 100, open_rate: 48.2, emails_opened: 48, click_rate: 6.1, unsubscribes: 1, total_clicks: 9, status: "completed" } }] });
  if (path.startsWith("/broadcasts?")) return json({ broadcasts: [{ id: 5, subject: "October note", status: "completed", send_at: "2026-10-10T09:00:00Z" }] });
  if (path.startsWith("/sequences")) return json({ sequences: [{ id: 3, name: "After the report", active: true, email_count: 5, subscriber_count: 12, stats: { recipients: 60, open_rate: 55, click_rate: 8, unsubscribe_rate: 0 } }] });
  return new Response("not found", { status: 404 });
}

describe("kitOverview", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn(async (url: string) => fakeKit(String(url)))));
  afterEach(() => vi.unstubAllGlobals());

  it("assembles subscribers, growth, stats, pipeline tags, broadcasts and sequences", async () => {
    const { kitOverview, _resetKitCache } = await import("./kitStats");
    _resetKitCache();
    const o = await kitOverview(30);
    expect(o.configured).toBe(true);
    expect(o.error).toBeUndefined();
    expect(o.account.name).toBe("Marin Lazic");
    expect(o.subscribers).toEqual({ active: 120, cancelled: 14, bounced: null });
    expect(o.growth?.newSubscribers).toBe(9);
    expect(o.emailStats?.openRate).toBe(50);
    // site tags first, in pipeline order, then the rest by size
    expect(o.tags.map(t => [t.name, t.count])).toEqual([["assessment-started", 38], ["assessment-completed", 27], ["newsletter", 80]]);
    expect(o.broadcasts[0]).toMatchObject({ subject: "October note", recipients: 100, openRate: 48.2, clicks: 9, status: "completed" });
    expect(o.sequences[0]).toMatchObject({ name: "After the report", emails: 5, subscribers: 12, openRate: 55 });
    expect(o.recentSubscribers[0]).toMatchObject({ email: "a@example.com", tags: ["assessment-completed"], source: "Assessment" });
  });

  it("caches for five minutes and refetches on force", async () => {
    const { kitOverview, _resetKitCache } = await import("./kitStats");
    _resetKitCache();
    await kitOverview(7);
    const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    await kitOverview(7);
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(calls);
    await kitOverview(7, true);
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(calls);
  });

  it("reports a failing Kit call without dropping the rest", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("/broadcasts/stats") ? new Response("boom", { status: 500 }) : fakeKit(String(url)))));
    const { kitOverview, _resetKitCache } = await import("./kitStats");
    _resetKitCache();
    const o = await kitOverview(30);
    expect(o.error).toMatch(/broadcast stats/);
    expect(o.broadcasts[0].recipients).toBe(0);
    expect(o.subscribers.active).toBe(120);
  });
});
