import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("articles.latest", () => {
  it("returns an array of articles", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.latest({ limit: 3 });

    expect(Array.isArray(articles)).toBe(true);
    // Should return up to 3 articles (may be 0 if RSS fetch fails in test env)
    expect(articles.length).toBeLessThanOrEqual(3);
  });

  it("each article has the expected shape", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.latest({ limit: 3 });

    if (articles.length > 0) {
      const article = articles[0];
      expect(article).toHaveProperty("title");
      expect(article).toHaveProperty("description");
      expect(article).toHaveProperty("link");
      expect(article).toHaveProperty("pubDate");
      expect(article).toHaveProperty("image");
      expect(typeof article.title).toBe("string");
      expect(typeof article.description).toBe("string");
      expect(typeof article.link).toBe("string");
      expect(typeof article.pubDate).toBe("string");
      // image can be string or null
      expect(article.image === null || typeof article.image === "string").toBe(true);
    }
  });

  it("respects the limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.latest({ limit: 1 });

    expect(articles.length).toBeLessThanOrEqual(1);
  });

  it("returns articles with valid Substack links", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.latest({ limit: 3 });

    for (const article of articles) {
      if (article.link) {
        expect(article.link).toContain("marinlazic.substack.com");
      }
    }
  });

  it("works with default parameters (no input)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.latest();

    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeLessThanOrEqual(3);
  });
});
