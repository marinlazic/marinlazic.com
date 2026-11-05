import { describe, expect, it, vi } from "vitest";
import { matchAiCrawler, matchAiReferrer } from "./aiCrawlers";
import { isBotUa } from "./botFilter";

describe("telling AI crawlers apart", () => {
  it("picks the live fetch over the training crawler for the same company", () => {
    expect(matchAiCrawler("Mozilla/5.0 ChatGPT-User/1.0; +https://openai.com/bot")?.id).toBe("chatgpt-user");
    expect(matchAiCrawler("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot")?.id).toBe("gptbot");
    expect(matchAiCrawler("Claude-User/1.0; +Claude-User@anthropic.com")?.id).toBe("claude-user");
    expect(matchAiCrawler("Mozilla/5.0 (compatible; ClaudeBot/1.0)")?.id).toBe("claudebot");
    expect(matchAiCrawler("Perplexity-User/1.0")?.id).toBe("perplexity-user");
  });

  it("does not let Googlebot swallow Google Extended", () => {
    expect(matchAiCrawler("Mozilla/5.0 (compatible; Google-Extended)")?.id).toBe("google-extended");
    expect(matchAiCrawler("Mozilla/5.0 (compatible; Googlebot/2.1)")?.id).toBe("googlebot");
    expect(matchAiCrawler("Mozilla/5.0 (compatible; Applebot-Extended/0.1)")?.id).toBe("applebot-extended");
  });

  it("leaves a real browser alone", () => {
    const chrome =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
    expect(matchAiCrawler(chrome)).toBeNull();
    expect(matchAiCrawler(null)).toBeNull();
    expect(matchAiCrawler("")).toBeNull();
  });

  it("marks every one of them as a bot, so they stay out of the visitor count", () => {
    for (const ua of ["GPTBot/1.2", "ClaudeBot/1.0", "PerplexityBot/1.0", "Googlebot/2.1", "CCBot/2.0"]) {
      expect(isBotUa(ua)).toBe(true);
    }
  });
});

describe("spotting a visit sent by an assistant", () => {
  it("recognises the assistants people actually use", () => {
    expect(matchAiReferrer("https://chatgpt.com/")?.id).toBe("chatgpt");
    expect(matchAiReferrer("https://www.perplexity.ai/search/abc")?.id).toBe("perplexity");
    expect(matchAiReferrer("https://claude.ai/chat/123")?.id).toBe("claude");
    expect(matchAiReferrer("https://gemini.google.com/app")?.id).toBe("gemini");
  });

  it("ignores ordinary referrers", () => {
    expect(matchAiReferrer("https://www.google.com/search?q=marin+lazic")).toBeNull();
    expect(matchAiReferrer("https://instagram.com/")).toBeNull();
    expect(matchAiReferrer(null)).toBeNull();
  });
});

describe("the middleware that records a crawl", () => {
  const run = async (opts: { method?: string; path: string; ua?: string }) => {
    const recorded: any[] = [];
    vi.resetModules();
    vi.doMock("./db", () => ({ trackEvent: async (e: any) => void recorded.push(e) }));
    const { registerAiCrawlerLog } = await import("./aiCrawlers");
    let handler: any;
    registerAiCrawlerLog({ use: (fn: any) => (handler = fn) } as any);
    let passedOn = false;
    await handler(
      {
        method: opts.method ?? "GET",
        path: opts.path,
        get: (h: string) => (h.toLowerCase() === "user-agent" ? opts.ua : undefined),
      },
      {},
      () => {
        passedOn = true;
      }
    );
    await new Promise(r => setTimeout(r, 0));
    return { recorded, passedOn };
  };

  it("records a real page read by a crawler and still serves the page", async () => {
    const { recorded, passedOn } = await run({ path: "/insights/hrv", ua: "Mozilla/5.0 (compatible; GPTBot/1.2)" });
    expect(passedOn).toBe(true);
    expect(recorded).toHaveLength(1);
    expect(recorded[0].eventType).toBe("ai_crawl");
    expect(JSON.parse(recorded[0].eventData)).toMatchObject({ crawler: "gptbot", kind: "training", path: "/insights/hrv" });
  });

  it("ignores people, assets, the API and the admin pages", async () => {
    const browser = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0 Safari/537.36";
    const gptbot = "GPTBot/1.2";
    expect((await run({ path: "/", ua: browser })).recorded).toHaveLength(0);
    expect((await run({ path: "/assets/app.js", ua: gptbot })).recorded).toHaveLength(0);
    expect((await run({ path: "/api/trpc/x", ua: gptbot })).recorded).toHaveLength(0);
    expect((await run({ path: "/admin", ua: gptbot })).recorded).toHaveLength(0);
    expect((await run({ path: "/hero.png", ua: gptbot })).recorded).toHaveLength(0);
    expect((await run({ method: "POST", path: "/", ua: gptbot })).recorded).toHaveLength(0);
  });

  it("still records the files crawlers come for", async () => {
    expect((await run({ path: "/llms.txt", ua: "ClaudeBot/1.0" })).recorded).toHaveLength(1);
    expect((await run({ path: "/sitemap.xml", ua: "PerplexityBot/1.0" })).recorded).toHaveLength(1);
  });
});
