import { describe, expect, it } from "vitest";
import { noDashes, sourceLabel, standing, type StoryEvent } from "./followup";
import { addressesIn, classify, messageText, promiseIn } from "./gmail";

const now = new Date("2026-10-19T08:00:00Z");
const day = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const ev = (kind: StoryEvent["kind"], daysAgo: number, extra: Partial<StoryEvent> = {}): StoryEvent => ({
  id: `${kind}-${daysAgo}`,
  email: "a@example.com",
  kind,
  channel: "email",
  at: day(daysAgo),
  subject: null,
  snippet: null,
  origin: "site",
  ...extra,
});

describe("stage rules", () => {
  it("never replied: a form and automated emails only", () => {
    const s = standing([ev("form", 3), ev("auto", 3)], "all-in", now);
    expect(s.stage).toBe("Never replied");
    expect(s.priority).toBe("High");
    expect(s.lastBy).toBe("Lead");
    expect(s.days).toBe(3);
    expect(s.needsDraft).toBe(true);
  });

  it("never replied cools off with age unless they were keen", () => {
    expect(standing([ev("form", 40)], "curious", now).priority).toBe("Medium");
    expect(standing([ev("form", 40)], "all-in", now).priority).toBe("High");
    expect(standing([ev("form", 120)], "all-in", now).priority).toBe("Low");
  });

  it("reply owed when they wrote last", () => {
    const s = standing([ev("form", 20), ev("sent", 15), ev("reply", 10)], null, now);
    expect(s.stage).toBe("Reply owed");
    expect(s.priority).toBe("High");
    expect(s.days).toBe(10);
    expect(s.sent).toBe(1);
    expect(s.replies).toBe(1);
  });

  it("waiting on lead right after Marin writes, then a nudge is due", () => {
    const fresh = standing([ev("form", 10), ev("sent", 2)], null, now);
    expect(fresh.stage).toBe("Waiting on lead");
    expect(fresh.needsDraft).toBe(false);
    expect(fresh.nextActionFixed).toMatch(/Give them until/);
    const due = standing([ev("form", 10), ev("sent", 8)], null, now);
    expect(due.stage).toBe("Waiting on lead");
    expect(due.priority).toBe("Medium");
    expect(due.needsDraft).toBe(true);
  });

  it("gone quiet after three weeks of silence", () => {
    const s = standing([ev("form", 60), ev("sent", 50), ev("sent", 30)], null, now);
    expect(s.stage).toBe("Gone quiet");
    expect(s.needsDraft).toBe(false);
    expect(s.nextActionFixed).toMatch(/2 emails/);
  });

  it("won needs a welcome until Marin writes after the purchase", () => {
    const bought = standing([ev("purchase", 2), ev("form", 1)], "all-in", now);
    expect(bought.stage).toBe("Won");
    expect(bought.priority).toBe("High");
    expect(bought.needsDraft).toBe(true);
    const welcomed = standing([ev("purchase", 5), ev("sent", 4)], null, now);
    expect(welcomed.stage).toBe("Won");
    expect(welcomed.priority).toBe("Low");
    expect(welcomed.needsDraft).toBe(false);
  });

  it("a client who replies is owed a reply", () => {
    const s = standing([ev("purchase", 9), ev("sent", 8), ev("reply", 1)], null, now);
    expect(s.stage).toBe("Reply owed");
  });

  it("a promise from Marin keeps the ball with Marin", () => {
    const s = standing([ev("form", 60), ev("sent", 50), ev("reply", 48), ev("sent", 40, { promise: true })], null, now);
    expect(s.stage).toBe("Reply owed");
    expect(s.promised).toBe(true);
    expect(s.days).toBe(40);
    expect(s.priority).toBe("High");
  });

  it("a new form after Marin's email puts the ball back with Marin", () => {
    const s = standing([ev("form", 30), ev("sent", 25), ev("form", 2)], null, now);
    expect(s.stage).toBe("Reply owed");
  });
});

describe("copy and labels", () => {
  it("strips every kind of dash", () => {
    expect(noDashes("A pre-season plan, 3-4 sets — then chin-ups – done")).toBe("A pre season plan, 3 to 4 sets, then chin ups, done");
    expect(noDashes("one-to-one")).toBe("one to one");
  });

  it("names the source", () => {
    expect(sourceLabel("instagram", null, false)).toBe("Instagram");
    expect(sourceLabel("Substack", null, false)).toBe("Substack");
    expect(sourceLabel(null, "coaching-application", false)).toBe("Coaching application");
    expect(sourceLabel(null, "https://www.linkedin.com/feed/", false)).toBe("LinkedIn");
    expect(sourceLabel(null, null, true)).toBe("BridgeAthletic");
    expect(sourceLabel(null, "performance-assessment-v2", false)).toBe("Not recorded");
  });
});

describe("gmail classification", () => {
  const mine = new Set(["marin@marinlazic.coach"]);
  const msg = (headers: Record<string, string>, labelIds: string[] = []) => ({ id: "1", threadId: "t", labelIds, payload: { headers: Object.entries(headers).map(([name, value]) => ({ name, value })) } });

  it("finds addresses in display name headers", () => {
    expect(addressesIn('"Lazic, Marin" <Marin@MarinLazic.coach>, ann <ann@example.com>')).toEqual(["marin@marinlazic.coach", "ann@example.com"]);
  });

  it("sent, reply, automated and unrelated", () => {
    expect(classify(msg({ From: "Marin <marin@marinlazic.coach>", To: "ann@example.com" }, ["SENT"]), "ann@example.com", mine)).toEqual({ kind: "sent", email: "ann@example.com" });
    expect(classify(msg({ From: "Marin <marin@marinlazic.coach>", To: "ann@example.com", "List-Unsubscribe": "<https://x>" }), "ann@example.com", mine)).toEqual({ kind: "auto", email: "ann@example.com" });
    expect(classify(msg({ From: "Ann <ann@example.com>", To: "marin@marinlazic.coach" }), "ann@example.com", mine)).toEqual({ kind: "reply", email: "ann@example.com" });
    expect(classify(msg({ From: "someone@else.com", To: "ann@example.com" }), "ann@example.com", mine)).toBeNull();
    expect(classify(msg({ From: "marin@marinlazic.coach", To: "bob@example.com" }, ["SENT"]), "ann@example.com", mine)).toBeNull();
  });

  it("spots a promise in Marin's own words", () => {
    expect(promiseIn("Thanks Leah. I'll revise the plan and get back to you early next week.")).toBe(true);
    expect(promiseIn("Let me put together a plan and send it through on Friday.")).toBe(true);
    expect(promiseIn("No worries at all, good luck with the selections.")).toBe(false);
    expect(promiseIn("Here is the program, let me know how you go.")).toBe(false);
    expect(promiseIn(undefined)).toBe(false);
  });

  it("reads the text of a full message", () => {
    const b64 = (s: string) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
    const m = { id: "1", threadId: "t", payload: { mimeType: "multipart/alternative", parts: [{ mimeType: "text/plain", body: { data: b64("Ann (ann@example.com) purchased Water Polo Max") } }, { mimeType: "text/html", body: { data: b64("<p>html</p>") } }] } };
    expect(messageText(m)).toContain("ann@example.com");
  });
});
