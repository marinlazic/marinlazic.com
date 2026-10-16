import { describe, it, expect } from "vitest";

describe("Kit API key validation", () => {
  it("can authenticate with the Kit v4 API", async () => {
    const apiKey = process.env.KIT_API_KEY;
    expect(apiKey).toBeTruthy();

    // List tags to verify the API key works
    const response = await fetch("https://api.kit.com/v4/tags?per_page=1", {
      headers: {
        "X-Kit-Api-Key": apiKey!,
        "Accept": "application/json",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("tags");
  });
});
