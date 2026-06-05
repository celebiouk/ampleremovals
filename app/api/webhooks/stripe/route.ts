import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

// Stripe requires the raw request body for signature verification.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Phase 1 scaffold: verifies the signature and acknowledges. The handling of
 * payment events (marking invoices paid, recording payments, advancing
 * booking status) is implemented in Phase 5.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!webhookSecret || webhookSecret.startsWith("your_") || !signature) {
    // Not configured yet — acknowledge so Stripe doesn't retry endlessly.
    return NextResponse.json({ received: true, configured: false });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Phase 5 will switch on event.type (checkout.session.completed,
  // payment_intent.succeeded, etc.) and update invoices/payments/bookings.
  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
