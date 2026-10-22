import { describe, expect, it } from "vitest";
import { resolveShortLink, SHORT_CHANNELS } from "./shortLinks";
import { isBotUa } from "./botFilter";

describe("tagged short links", () => {
  it("sends a bare channel to the guide with the source and medium", () => {
    expect(resolveShortLink("ig")).toBe("/recovery-guide?utm_source=instagram&utm_medium=social");
    expect(resolveShortLink("kit")).toBe("/recovery-guide?utm_source=kit&utm_medium=email");
  });

  it("sends a second segment to that page", () => {
    expect(resolveShortLink("yt", "a")).toBe("/assessment?utm_source=youtube&utm_medium=video");
    expect(resolveShortLink("sub", "p")).toBe("/program?utm_source=substack&utm_medium=newsletter");
  });

  it("adds a campaign from the third segment, cleaned up", () => {
    expect(resolveShortLink("ig", "a", "October Push")).toBe(
      "/assessment?utm_source=instagram&utm_medium=social&utm_campaign=octoberpush"
    );
  });

  it("falls through for anything that is not a channel", () => {
    expect(resolveShortLink("about")).toBeNull();
    expect(resolveShortLink("assessment")).toBeNull();
    expect(resolveShortLink("ig", "nope")).toBeNull();
  });

  it("never shadows a real page", () => {
    const pages = ["about", "assessment", "program", "speaking", "resources", "insights", "admin", "api", "recovery-guide", "media", "report"];
    for (const page of pages) expect(SHORT_CHANNELS[page]).toBeUndefined();
  });
});

describe("who counts as a visitor", () => {
  it("knows a crawler and the smoke test from a browser", () => {
    expect(isBotUa("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBotUa("marinlazic-smoke/1.0")).toBe(true);
    expect(isBotUa("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUa("curl/8.4.0")).toBe(true);
    expect(isBotUa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe(false);
    expect(isBotUa("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129.0 Safari/537.36")).toBe(false);
  });

  it("keeps a row with no user agent", () => {
    expect(isBotUa(null)).toBe(false);
    expect(isBotUa("")).toBe(false);
  });
});
