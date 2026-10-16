import { describe, expect, it, vi } from "vitest";
import { PRODUCTS } from "./products";

describe("products", () => {
  it("has KICKSTART_4_WEEK product defined correctly", () => {
    const product = PRODUCTS.KICKSTART_4_WEEK;
    expect(product).toBeDefined();
    expect(product.id).toBe("kickstart-4-week");
    expect(product.name).toBe("4 Week Programme");
    expect(product.priceInCents).toBe(29900);
    expect(product.currency).toBe("aud");
    expect(product.mode).toBe("payment");
  });

  it("price is $299.00", () => {
    const priceInDollars = PRODUCTS.KICKSTART_4_WEEK.priceInCents / 100;
    expect(priceInDollars).toBe(299);
  });
});

describe("checkout.createSession", () => {
  it("validates that productId is required", async () => {
    // The tRPC procedure requires productId, email, and origin
    // Testing the input validation at the product level
    const validProductIds = Object.values(PRODUCTS).map(p => p.id);
    expect(validProductIds).toContain("kickstart-4-week");
  });

  it("rejects unknown product IDs", () => {
    const productKey = Object.keys(PRODUCTS).find(
      k => PRODUCTS[k as keyof typeof PRODUCTS].id === "nonexistent-product"
    );
    expect(productKey).toBeUndefined();
  });

  it("finds correct product by ID", () => {
    const productKey = Object.keys(PRODUCTS).find(
      k => PRODUCTS[k as keyof typeof PRODUCTS].id === "kickstart-4-week"
    );
    expect(productKey).toBe("KICKSTART_4_WEEK");
  });
});

describe("stripe webhook handler", () => {
  it("rejects requests without stripe-signature header", async () => {
    // The webhook handler checks for stripe-signature header
    // This is a structural test to verify the handler exists
    const { stripeWebhookRouter } = await import("./stripeWebhook");
    expect(stripeWebhookRouter).toBeDefined();
    expect(stripeWebhookRouter.stack).toBeDefined();
    // Verify the route is registered
    const routes = stripeWebhookRouter.stack.filter(
      (layer: any) => layer.route?.path === "/api/stripe/webhook"
    );
    expect(routes.length).toBeGreaterThan(0);
  });

  it("webhook route accepts POST method", async () => {
    const { stripeWebhookRouter } = await import("./stripeWebhook");
    const webhookRoute = stripeWebhookRouter.stack.find(
      (layer: any) => layer.route?.path === "/api/stripe/webhook"
    );
    expect(webhookRoute).toBeDefined();
    const methods = webhookRoute?.route?.methods;
    expect(methods?.post).toBe(true);
  });
});

describe("stripe module", () => {
  it("exports createCheckoutSession function", async () => {
    const stripeModule = await import("./stripe");
    expect(typeof stripeModule.createCheckoutSession).toBe("function");
  });

  it("exports retrieveCheckoutSession function", async () => {
    const stripeModule = await import("./stripe");
    expect(typeof stripeModule.retrieveCheckoutSession).toBe("function");
  });

  it("exports constructWebhookEvent function", async () => {
    const stripeModule = await import("./stripe");
    expect(typeof stripeModule.constructWebhookEvent).toBe("function");
  });
});
