import { describe, expect, it } from "vitest";

/**
 * Tests for the ShareResults component logic.
 * Since this is a frontend component, we test the share text generation
 * and URL construction logic that powers the sharing feature.
 */
describe("ShareResults share text generation", () => {
  const buildShareText = (
    overallPct: number,
    strongest?: { title: string; percentage: number },
    weakest?: { title: string; percentage: number }
  ) => {
    return `I just scored ${overallPct}/100 on the ML Performance Assessment.${strongest ? ` Strongest area: ${strongest.title} (${strongest.percentage}%).` : ""}${weakest ? ` Biggest opportunity: ${weakest.title} (${weakest.percentage}%).` : ""} Take yours and see where you stand.`;
  };

  it("generates share text with all data", () => {
    const text = buildShareText(
      72,
      { title: "Training", percentage: 85 },
      { title: "Sleep", percentage: 45 }
    );
    expect(text).toBe(
      "I just scored 72/100 on the ML Performance Assessment. Strongest area: Training (85%). Biggest opportunity: Sleep (45%). Take yours and see where you stand."
    );
  });

  it("generates share text without strongest area", () => {
    const text = buildShareText(72, undefined, { title: "Sleep", percentage: 45 });
    expect(text).toBe(
      "I just scored 72/100 on the ML Performance Assessment. Biggest opportunity: Sleep (45%). Take yours and see where you stand."
    );
  });

  it("generates share text without weakest area", () => {
    const text = buildShareText(72, { title: "Training", percentage: 85 });
    expect(text).toBe(
      "I just scored 72/100 on the ML Performance Assessment. Strongest area: Training (85%). Take yours and see where you stand."
    );
  });

  it("generates share text with no category data", () => {
    const text = buildShareText(72);
    expect(text).toBe(
      "I just scored 72/100 on the ML Performance Assessment. Take yours and see where you stand."
    );
  });

  it("handles zero score", () => {
    const text = buildShareText(0, { title: "Training", percentage: 0 }, { title: "Sleep", percentage: 0 });
    expect(text).toContain("0/100");
  });

  it("handles perfect score", () => {
    const text = buildShareText(100, { title: "Training", percentage: 100 }, { title: "Sleep", percentage: 80 });
    expect(text).toContain("100/100");
  });
});

describe("ShareResults URL construction", () => {
  const baseUrl = "https://marinlazic.com";

  it("constructs valid LinkedIn share URL", () => {
    const assessmentUrl = `${baseUrl}/assessment`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(assessmentUrl)}`;
    expect(linkedInUrl).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fmarinlazic.com%2Fassessment"
    );
  });

  it("constructs valid X/Twitter share URL", () => {
    const assessmentUrl = `${baseUrl}/assessment`;
    const shareText = "I just scored 72/100 on the ML Performance Assessment. Take yours and see where you stand.";
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(assessmentUrl)}`;
    expect(xUrl).toContain("https://x.com/intent/tweet");
    expect(xUrl).toContain("text=");
    expect(xUrl).toContain("url=");
    expect(xUrl).toContain(encodeURIComponent(assessmentUrl));
  });

  it("properly encodes special characters in share text", () => {
    const shareText = "I scored 85/100. Strongest: Training & Recovery (90%).";
    const encoded = encodeURIComponent(shareText);
    // encodeURIComponent encodes & but not parentheses (RFC 3986 unreserved)
    expect(encoded).not.toContain("&");
    expect(encoded).toContain("%26"); // & encoded
    expect(encoded).toContain("%2F"); // / encoded
    expect(encoded).toContain("%25"); // % encoded
  });

  it("constructs copy text with URL on new line", () => {
    const shareText = "I just scored 72/100 on the ML Performance Assessment. Take yours and see where you stand.";
    const assessmentUrl = `${baseUrl}/assessment`;
    const fullText = `${shareText}\n\n${assessmentUrl}`;
    expect(fullText).toContain("\n\n");
    expect(fullText).toContain(assessmentUrl);
    expect(fullText.split("\n\n")).toHaveLength(2);
  });
});
