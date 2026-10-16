import { afterEach, describe, expect, it, vi } from "vitest";

type BrowserState = {
  pathname: string;
  search: string;
  origin: string;
  referrer: string;
};

function installBrowser(state: BrowserState) {
  const values = new Map<string, string>();
  const browser = {
    location: {
      pathname: state.pathname,
      search: state.search,
      origin: state.origin,
    },
    document: { referrer: state.referrer },
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  };

  vi.stubGlobal("window", browser);
  return { browser, values };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("analytics attribution", () => {
  it("stores a privacy-safe first touch and retains it across route changes", async () => {
    const { browser } = installBrowser({
      pathname: "/assessment",
      search: "?utm_source=google&utm_campaign=spring&email=person%40example.com",
      origin: "https://marinlazic.com",
      referrer: "https://google.com/search?q=marin&email=person%40example.com",
    });
    const { getAttribution, getCampaignValue } = await import("../client/src/lib/attribution");

    expect(getAttribution()).toEqual({
      landingPath: "/assessment",
      referrer: "https://google.com/search",
      utm_source: "google",
      utm_campaign: "spring",
    });

    browser.location.pathname = "/apply";
    browser.location.search = "";
    expect(getAttribution().landingPath).toBe("/assessment");
    expect(getCampaignValue("source")).toBe("google");
    expect(getCampaignValue("campaign", "?utm_campaign=summer")).toBe("summer");
  });

  it("strips referrer credentials and rejects non-HTTP referrers", async () => {
    const { sanitizePath, sanitizeReferrer } = await import("../client/src/lib/attribution");

    expect(sanitizePath("/apply?name=Pat&email=pat@example.com#form")).toBe("/apply");
    expect(sanitizeReferrer("https://user:secret@example.com/path?email=pat@example.com#top"))
      .toBe("https://example.com/path");
    expect(sanitizeReferrer("javascript:alert(1)")).toBe("");
  });
});
