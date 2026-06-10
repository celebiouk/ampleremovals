import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";
import { calculateDriverEarnings } from "@/lib/driver-earnings";
import { sendAdminPush } from "@/lib/push-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!webhookSecret || webhookSecret.startsWith("your_") || !signature) {
    return NextResponse.json({ received: true, configured: false });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "Invalid"}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoice_id;
        if (!invoiceId) break;

        // Idempotency check
        const { data: inv } = await supabase.from("invoices").select("id, paid_at, type, booking_id, customer_id, total, vat_amount, invoice_number").eq("id", invoiceId).single();
        if (!inv || inv.paid_at) break; // already processed

        const now = new Date().toISOString();
        const amountPaid = pi.amount_received / 100;

        // Update invoice
        await supabase.from("invoices").update({
          status: "paid",
          paid_at: now,
          stripe_payment_intent_id: pi.id,
        }).eq("id", invoiceId);

        // Insert payment record
        await supabase.from("payments").insert({
          invoice_id: invoiceId,
          booking_id: inv.booking_id,
          customer_id: inv.customer_id,
          amount: amountPaid,
          stripe_payment_intent_id: pi.id,
          payment_method: pi.payment_method_types?.[0] ?? "card",
          paid_at: now,
        });

        // Update booking status
        const newStatus = inv.type === "deposit" ? "deposit_paid_job_confirmed" : "full_balance_paid";
        const { data: currentBooking } = await supabase.from("bookings").select("status").eq("id", inv.booking_id).single();
        await supabase.from("bookings").update({ status: newStatus }).eq("id", inv.booking_id);
        await supabase.from("status_history").insert({ booking_id: inv.booking_id, previous_status: currentBooking?.status ?? null, new_status: newStatus, changed_by: "system" });

        // Activity log
        await supabase.from("activity_log").insert({
          booking_id: inv.booking_id,
          action: `Payment received via Stripe for invoice ${inv.invoice_number} — £${amountPaid.toFixed(2)}`,
          metadata: { invoiceId, stripePaymentIntentId: pi.id, amount: amountPaid },
          performed_by: "system",
        });

        // Notification
        const { data: customerRow } = await supabase.from("customers").select("full_name").eq("id", inv.customer_id).single();
        await supabase.from("notifications").insert({
          type: "invoice_paid",
          title: "Invoice Paid via Stripe",
          description: `${customerRow?.full_name ?? "Customer"} paid invoice ${inv.invoice_number} — £${amountPaid.toFixed(2)}`,
          booking_id: inv.booking_id,
        });

        await sendAdminPush({
          title: "💳 Payment received",
          body: `${customerRow?.full_name ?? "Customer"} paid ${inv.invoice_number} — £${amountPaid.toFixed(2)}`,
          data: { bookingId: inv.booking_id },
        });

        // Trigger job confirmed automation
        if (inv.type === "deposit") {
          try {
            const { data: rule } = await supabase.from("automation_rules").select("id").eq("trigger_event", "status_changed_job_confirmed").eq("is_active", true).maybeSingle();
            if (rule) await supabase.from("automation_logs").insert({ rule_id: rule.id, booking_id: inv.booking_id, triggered_at: now, status: "pending" });
          } catch { /* non-critical */ }
        }

        // ── PHASE 11D: Calculate Driver Earnings ──────────────────
        // When a full invoice is paid, compute what each assigned driver is
        // owed. Shared with the manual mark-paid path so it fires no matter
        // how the customer paid. (Driver payout stays manual.)
        if (inv.type === "full") {
          await calculateDriverEarnings(inv.booking_id, inv.total, inv.vat_amount ?? 0);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoice_id;
        if (!invoiceId) break;

        const { data: inv } = await supabase.from("invoices").select("booking_id, invoice_number").eq("id", invoiceId).single();
        if (!inv) break;

        await supabase.from("activity_log").insert({
          booking_id: inv.booking_id,
          action: `Stripe payment failed for invoice ${inv.invoice_number}`,
          metadata: { invoiceId, stripePaymentIntentId: pi.id },
          performed_by: "system",
        });
        try {
          await supabase.from("notifications").insert({ type: "payment_failed", title: "Payment Failed", description: `Payment failed for invoice ${inv.invoice_number}`, booking_id: inv.booking_id });
        } catch { /* non-critical */ }
        break;
      }

      default:
        // Log unknown events silently
        break;
    }
  } catch (err) {
    await logError({ message: `Stripe webhook handler error (${event.type}): ${err instanceof Error ? err.message : String(err)}`, metadata: { eventId: event.id } });
    // Always return 200 — never let a webhook return 500
  }

  return NextResponse.json({ received: true });
}
