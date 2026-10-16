import { describe, expect, it } from "vitest";
import { Resend } from "resend";

describe("Resend API key validation", () => {
  it("can authenticate and send a test email with the Resend API", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();

    const resend = new Resend(apiKey);

    // Send a test email to validate the key works for sending
    // Using Resend's test address which does not actually deliver
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["delivered@resend.dev"],
      subject: "API Key Validation Test",
      html: "<p>Test</p>",
    });

    // If the key is invalid, we get auth errors
    if (error) {
      expect(error.name).not.toBe("missing_api_key");
      expect(error.name).not.toBe("invalid_api_key");
    }

    // Key is valid and can send emails
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toBeTruthy();
  });
});
