// ─── Product Definitions ────────────────────────────────
// Centralized product catalog for Stripe checkout

export const PRODUCTS = {
  KICKSTART_4_WEEK: {
    id: "kickstart-4-week",
    name: "4-Week Kickstart Program",
    description:
      "A structured 4-week program built from your assessment results. Includes periodised training, sleep optimisation, recovery framework, nutrition guidelines, and weekly email check-ins.",
    priceInCents: 29900, // $299.00
    currency: "usd",
    mode: "payment" as const,
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;
