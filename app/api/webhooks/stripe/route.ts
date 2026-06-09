import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";

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
        const { data: inv } = await supabase.from("invoices").select("id, paid_at, type, booking_id, customer_id, total, invoice_number").eq("id", invoiceId).single();
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

        // Trigger job confirmed automation
        if (inv.type === "deposit") {
          try {
            const { data: rule } = await supabase.from("automation_rules").select("id").eq("trigger_event", "status_changed_job_confirmed").eq("is_active", true).maybeSingle();
            if (rule) await supabase.from("automation_logs").insert({ rule_id: rule.id, booking_id: inv.booking_id, triggered_at: now, status: "pending" });
          } catch { /* non-critical */ }
        }

        // ── PHASE 11D: Calculate Driver Earnings ──────────────────
        // When full invoice is paid, calculate earnings for assigned drivers
        if (inv.type === "full") {
          try {
            // Get all assigned drivers for this booking
            const { data: assignments } = await supabase
              .from("booking_driver_assignments")
              .select("id, driver_id, pay_percentage_override, drivers(default_pay_percentage)")
              .eq("booking_id", inv.booking_id);

            if (assignments && assignments.length > 0) {
              for (const assignment of assignments) {
                // Check if earnings already exist (idempotency)
                const { data: existingEarnings } = await supabase
                  .from("driver_earnings")
                  .select("id")
                  .eq("assignment_id", assignment.id)
                  .single();

                if (existingEarnings) continue; // Already calculated

                // Calculate earnings
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const payPercentage = assignment.pay_percentage_override || (assignment.drivers as any)?.default_pay_percentage || 0;
                const grossEarnings = (inv.total * payPercentage) / 100;

                // Get existing tips for this driver on this booking
                const { data: tips } = await supabase
                  .from("driver_tips")
                  .select("amount")
                  .eq("driver_id", assignment.driver_id)
                  .eq("booking_id", inv.booking_id);

                const tipAmount = tips?.reduce((sum, tip) => sum + tip.amount, 0) || 0;
                const totalEarnings = grossEarnings + tipAmount;

                // Insert earnings record
                await supabase.from("driver_earnings").insert({
                  driver_id: assignment.driver_id,
                  booking_id: inv.booking_id,
                  assignment_id: assignment.id,
                  booking_total: inv.total,
                  pay_percentage: payPercentage,
                  gross_earnings: grossEarnings,
                  tip_amount: tipAmount,
                  total_earnings: totalEarnings,
                  status: "pending", // Requires admin approval
                });

                // Log activity
                await supabase.from("activity_log").insert({
                  booking_id: inv.booking_id,
                  action: `Driver earnings calculated: £${totalEarnings.toFixed(2)} (${payPercentage}%)`,
                  metadata: { driver_id: assignment.driver_id, earnings: totalEarnings },
                  performed_by: "system",
                });
              }
            }
          } catch (earningsError) {
            console.error("Driver earnings calculation error:", earningsError);
            // Don't fail the webhook if earnings fail
          }
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
