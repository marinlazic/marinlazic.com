import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.GEMINI_API_KEY = "test-key";

describe("invokeLLM retries when Google is busy", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a 503 and returns the later success", async () => {
    const calls: number[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls.push(Date.now());
        if (calls.length < 3) return new Response("overloaded", { status: 503, statusText: "Service Unavailable" });
        return new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content: "OK" } }] }), { status: 200, headers: { "content-type": "application/json" } });
      })
    );
    const { invokeLLM } = await import("./_core/llm");
    const pending = invokeLLM({ messages: [{ role: "user", content: "hi" }] });
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(5000);
    const result = await pending;
    expect(calls.length).toBe(3);
    expect(result.choices[0].message.content).toBe("OK");
  });

  it("does not retry a 400", async () => {
    const fetchMock = vi.fn(async () => new Response("bad request", { status: 400, statusText: "Bad Request" }));
    vi.stubGlobal("fetch", fetchMock);
    const { invokeLLM } = await import("./_core/llm");
    await expect(invokeLLM({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(/400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after four busy answers", async () => {
    const fetchMock = vi.fn(async () => new Response("overloaded", { status: 503, statusText: "Service Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    const { invokeLLM } = await import("./_core/llm");
    const pending = invokeLLM({ messages: [{ role: "user", content: "hi" }] });
    const expectation = expect(pending).rejects.toThrow(/503/);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(10000);
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
