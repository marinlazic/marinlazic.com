// ─── Product Definitions ────────────────────────────────
// Centralized product catalog for Stripe checkout

export const PRODUCTS = {
  KICKSTART_4_WEEK: {
    id: "kickstart-4-week",
    name: "4 Week Programme",
    description:
      "A structured four week programme built from your assessment results. Periodised training, sleep, recovery and nutrition guidance, with weekly email check ins.",
    priceInCents: 29900, // $299.00 AUD
    currency: "aud",
    mode: "payment" as const,
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;

export function formatAmount(cents: number, currency: string) {
  const amount = (cents / 100).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${amount} ${currency.toUpperCase()}`;
}
