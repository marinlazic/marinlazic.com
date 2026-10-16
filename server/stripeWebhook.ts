import { Router, raw } from "express";
import { constructWebhookEvent } from "./stripe";
import { notifyOwner } from "./_core/notification";
import { createLead } from "./db";

export const stripeWebhookRouter = Router();

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

    // Handle test events for webhook verification
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const customerEmail = session.metadata?.customer_email || session.customer_email || "";
          const customerName = session.metadata?.customer_name || "";
          const productId = session.metadata?.product_id || "";
          const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";

          console.log(`[Stripe Webhook] Checkout completed: ${customerEmail} purchased ${productId} for $${amountTotal}`);

          // Save as a converted lead
          try {
            await createLead({
              email: customerEmail,
              name: customerName || null,
              source: `stripe-purchase-${productId}`,
              message: `Purchased: ${productId} | Amount: $${amountTotal} | Session: ${session.id} | Payment Intent: ${session.payment_intent}`,
            });
          } catch (e) {
            console.warn("[Stripe Webhook] Failed to save purchase lead:", e);
          }

          // Notify owner of the purchase
          try {
            await notifyOwner({
              title: `💰 New Purchase: $${amountTotal}`,
              content: `NEW PURCHASE!\n\nCustomer: ${customerName || "N/A"}\nEmail: ${customerEmail}\nProduct: ${productId}\nAmount: $${amountTotal}\nSession: ${session.id}\n\nTime: ${new Date().toISOString()}`,
            });
          } catch (e) {
            console.warn("[Stripe Webhook] Failed to notify owner:", e);
          }

          break;
        }

        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as any;
          console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id} ($${(paymentIntent.amount / 100).toFixed(2)})`);
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

    // Always acknowledge receipt
    res.json({ received: true });
  }
);
