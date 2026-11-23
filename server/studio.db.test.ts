// Runs the Studio's create and write flow against a real database with the
// model stubbed. Needs DATABASE_URL; skipped without one.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async ({ messages }: { messages: { role: string; content: string }[] }) => {
    const user = messages.find(m => m.role === "user")?.content ?? "";
    const isCore = /^The idea:/.test(user);
    const body = isCore
      ? { title: "Rest is where the gain happens.", slug: "rest-gain", hooks: ["Rest is where the gain happens", "You get fitter after the session", "Work plus rest"], core: "## Idea, in one sentence\nRest is where the gain happens — not in the session!\n\n## Facts the pieces may use\n1. Training is a stress." }
      : { title: "Rest is where the gain happens", meta: { attach: "none", check: "first 3 lines" }, body: "Rest is where the gain happens.\n\nYou optimize nothing by skipping it – the body repairs afterwards! 🙂\n\nTake the free assessment at marinlazic.com/assessment" };
    return { id: "x", created: 0, model: "stub", choices: [{ index: 0, message: { role: "assistant", content: "```json\n" + JSON.stringify(body) + "\n```" }, finish_reason: "stop" }] };
  }),
}));

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("studio against the database", () => {
  let studio: typeof import("./studio");
  let ideaId = 0;
  beforeAll(async () => {
    studio = await import("./studio");
  });
  afterAll(async () => {
    if (ideaId) await studio.deleteIdea(ideaId);
  });

  it("creates an idea with a cleaned core and queued pieces", async () => {
    const idea = await studio.createIdea({ idea: "Rest is where the gain happens, not the session.", cta: "assessment", channels: ["linkedin-post", "x-post"] });
    ideaId = idea.id;
    expect(idea.slug).toMatch(/^rest-gain/);
    expect(idea.core).not.toMatch(/[—–!]/);
    const full = await studio.getIdea(idea.id);
    expect(full?.pieces.map(p => [p.channel, p.status])).toEqual([
      ["linkedin-post", "pending"],
      ["x-post", "pending"],
    ]);
  });

  it("writes a piece, fixes the mechanical faults and keeps the word for a person", async () => {
    const full = await studio.getIdea(ideaId);
    const piece = full!.pieces[0];
    const written = await studio.generatePiece(piece.id);
    expect(written.status).toBe("draft");
    expect(written.body).not.toMatch(/[—–!🙂]/);
    expect(written.body).toContain("skipping it, the body repairs afterwards.");
    expect(written.checks.map(c => c.message)).toEqual([expect.stringContaining("banned"), expect.stringContaining("US spelling")]);
    expect(written.meta).toEqual({ attach: "none", check: "first 3 lines" });
  });

  it("marks a piece posted, takes a reading, and adds it up by platform", async () => {
    const full = await studio.getIdea(ideaId);
    const piece = full!.pieces[0];
    await studio.updatePiece({ id: piece.id, status: "posted", url: "https://www.linkedin.com/posts/x" });
    await studio.addStats({ pieceId: piece.id, impressions: 1000, likes: 40, comments: 5, followers: 3 });
    await studio.addStats({ pieceId: piece.id, impressions: 1500, likes: 60, comments: 8, followers: 4 });
    const stats = await studio.platformStats(7);
    const li = stats.platforms.find(p => p.platform === "linkedin")!;
    expect(li.posts).toBeGreaterThanOrEqual(1);
    const mine = stats.pieces.find(p => p.id === piece.id)!;
    expect(mine.impressions).toBe(1500);
    expect(mine.engagement).toBe(68);
    const again = await studio.getIdea(ideaId);
    expect(again!.pieces[0].stats?.followers).toBe(4);
    expect(again!.status).toBe("draft"); // x-post is still queued
  });
});
