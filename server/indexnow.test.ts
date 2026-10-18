import { describe, expect, it, vi } from "vitest";
import { INDEXNOW_KEY, submitChangedUrls } from "./indexNow";
import { sitemapEntries } from "../client/src/data/siteMetadata";
import fs from "node:fs";
import path from "node:path";

describe("IndexNow", () => {
  it("serves the key file search engines fetch to verify ownership", () => {
    const file = path.resolve(import.meta.dirname, `../client/public/${INDEXNOW_KEY}.txt`);
    expect(fs.readFileSync(file, "utf8").trim()).toBe(INDEXNOW_KEY);
  });

  it("submits every sitemap URL with the key and key location", async () => {
    let body: Record<string, unknown> | null = null;
    const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return new Response("", { status: 202 });
    });
    const result = await submitChangedUrls(fetchMock as unknown as typeof fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(202);
    expect(result.submitted.length).toBe(sitemapEntries().length);
    expect(body!.host).toBe("marinlazic.com");
    expect(body!.key).toBe(INDEXNOW_KEY);
    expect(body!.keyLocation).toBe(`https://marinlazic.com/${INDEXNOW_KEY}.txt`);
    expect((body!.urlList as string[]).every(u => u.startsWith("https://marinlazic.com/"))).toBe(true);
  });

  it("reports a rejected submission without throwing", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 429 }));
    const result = await submitChangedUrls(fetchMock as unknown as typeof fetch);
    expect(result.submitted).toEqual([]);
    expect(result.status).toBe(429);
  });
});
