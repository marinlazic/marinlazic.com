import { Router, raw } from "express";
import { constructWebhookEvent } from "./stripe";
import { notifyOwner } from "./_core/notification";
import { markLeadConverted } from "./db";
import { kitOnPurchase } from "./kit";
import { sendPurchaseConfirmationEmail } from "./email";
import { PRODUCTS, formatAmount } from "./products";

export const stripeWebhookRouter = Router();

function productName(productId: string) {
  const product = Object.values(PRODUCTS).find(p => p.id === productId);
  return product?.name ?? productId ?? "programme";
}

/** Handles a completed checkout. Exported so tests can call it directly. */
export async function handleCheckoutCompleted(session: any) {
  const customerEmail: string =
    session.metadata?.customer_email || session.customer_details?.email || session.customer_email || "";
  const customerName: string = session.metadata?.customer_name || session.customer_details?.name || "";
  const productId: string = session.metadata?.product_id || "";
  const leadId = Number(session.metadata?.lead_id) || undefined;
  const amountCents: number = session.amount_total ?? 0;
  const currency: string = session.currency || "aud";
  const amountFormatted = formatAmount(amountCents, currency);
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  console.log(`[Stripe Webhook] Checkout completed: ${productId} for ${amountFormatted}`);

  if (!customerEmail) {
    console.warn("[Stripe Webhook] No customer email on session", session.id);
    return;
  }

  // 1. Lead becomes converted with the purchase details.
  try {
    await markLeadConverted({
      leadId,
      email: customerEmail,
      name: customerName || null,
      stripeSessionId: session.id,
      stripePaymentIntent: paymentIntent,
      product: productId,
      amountCents,
      currency,
      paidAt: new Date(),
    });
  } catch (e) {
    console.warn("[Stripe Webhook] Failed to mark lead converted:", e);
  }

  // 2. Kit: tag purchased and record the purchase.
  kitOnPurchase(customerEmail, {
    product: productId,
    amount: (amountCents / 100).toFixed(2),
    date: new Date().toISOString().slice(0, 10),
    firstName: customerName || undefined,
  });

  // 3. Buyer confirmation.
  try {
    await sendPurchaseConfirmationEmail({
      email: customerEmail,
      name: customerName,
      productName: productName(productId),
      amountFormatted,
    });
  } catch (e) {
    console.warn("[Stripe Webhook] Failed to send buyer confirmation:", e);
  }

  // 4. Owner notification.
  try {
    await notifyOwner({
      title: `New purchase: ${amountFormatted}`,
      content: `Customer: ${customerName || "N/A"}\nEmail: ${customerEmail}\nProduct: ${productName(productId)}\nAmount: ${amountFormatted}\nSession: ${session.id}\nTime: ${new Date().toISOString()}`,
    });
  } catch (e) {
    console.warn("[Stripe Webhook] Failed to notify owner:", e);
  }
}

// Must use raw body for Stripe signature verification
stripeWebhookRouter.post(
  "/api/stripe/webhook",
  raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      console.warn("[Stripe Webhook] Missing stripe-signature header");
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event;
    try {
      event = constructWebhookEvent(req.body, signature);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as any);
          break;
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as any;
          console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
          break;
        }
        case "payment_intent.payment_failed": {
          const failedPayment = event.data.object as any;
          console.warn(`[Stripe Webhook] Payment failed: ${failedPayment.id} - ${failedPayment.last_payment_error?.message || "Unknown error"}`);
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      console.error(`[Stripe Webhook] Error processing event ${event.type}:`, err);
    }

    res.json({ received: true });
  }
);
