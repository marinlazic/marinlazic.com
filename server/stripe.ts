import Stripe from "stripe";
import { PRODUCTS } from "./products";

// Initialize Stripe with the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Please set it in Settings → Payment.");
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia" as any,
    });
  }
  return stripe;
}

export interface CreateCheckoutParams {
  productId: keyof typeof PRODUCTS;
  customerEmail: string;
  customerName?: string;
  assessmentId?: string;
  leadId?: number;
  origin: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const s = getStripe();
  const product = PRODUCTS[params.productId];

  if (!product) {
    throw new Error(`Unknown product: ${params.productId}`);
  }

  const session = await s.checkout.sessions.create({
    mode: product.mode,
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: product.currency,
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${params.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/payment/cancel`,
    metadata: {
      product_id: product.id,
      customer_email: params.customerEmail,
      customer_name: params.customerName || "",
      assessment_id: params.assessmentId || "",
      lead_id: params.leadId ? String(params.leadId) : "",
      ...params.metadata,
    },
  });

  return { url: session.url, sessionId: session.id };
}

export async function retrieveCheckoutSession(sessionId: string) {
  const s = getStripe();
  return s.checkout.sessions.retrieve(sessionId);
}

export function constructWebhookEvent(payload: Buffer, signature: string) {
  const s = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return s.webhooks.constructEvent(payload, signature, webhookSecret);
}
