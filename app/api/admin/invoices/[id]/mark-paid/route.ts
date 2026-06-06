import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";

const schema = z.object({
  paymentMethod: z.enum(["cash", "bank_transfer", "card"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });

  const invoiceId = params.id;
  const { paymentMethod } = parsed.data;
  const supabase = createAdminClient();

  try {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "paid") return NextResponse.json({ success: false, error: "Invoice is already paid" }, { status: 400 });
    if (invoice.status === "cancelled") return NextResponse.json({ success: false, error: "Invoice is cancelled" }, { status: 400 });

    const now = new Date().toISOString();

    // Mark invoice paid
    await supabase.from("invoices").update({ status: "paid", paid_at: now }).eq("id", invoiceId);

    // Insert payment record
    await supabase.from("payments").insert({
      invoice_id: invoiceId,
      booking_id: invoice.booking_id,
      customer_id: invoice.customer_id,
      amount: invoice.total,
      payment_method: paymentMethod,
      stripe_payment_intent_id: null,
      paid_at: now,
    });

    // Update booking status based on invoice type
    const newBookingStatus = invoice.type === "deposit" ? "deposit_paid_job_confirmed" : "full_balance_paid";
    const { data: currentBooking } = await supabase.from("bookings").select("status").eq("id", invoice.booking_id).single();

    await supabase.from("bookings").update({ status: newBookingStatus }).eq("id", invoice.booking_id);

    await supabase.from("status_history").insert({
      booking_id: invoice.booking_id,
      previous_status: currentBooking?.status ?? null,
      new_status: newBookingStatus,
      changed_by: "admin",
    });

    const actionLabel = invoice.type === "deposit" ? "Deposit paid — job confirmed" : "Full balance paid";
    await supabase.from("activity_log").insert({
      booking_id: invoice.booking_id,
      action: `${actionLabel} (manual — ${paymentMethod.replace("_", " ")})`,
      metadata: { invoiceId, invoiceNumber: invoice.invoice_number, amount: invoice.total },
      performed_by: "admin",
    });

    // Insert notification
    await supabase.from("notifications").insert({
      type: "invoice_paid",
      title: "Invoice Paid (Manual)",
      description: `Invoice ${invoice.invoice_number} for £${invoice.total} manually marked as paid.`,
      booking_id: invoice.booking_id,
    }).catch(() => null);

    // Trigger automation if deposit paid
    if (invoice.type === "deposit") {
      const { data: confirmedRule } = await supabase.from("automation_rules").select("id").eq("trigger_event", "status_changed_job_confirmed").eq("is_active", true).maybeSingle();
      if (confirmedRule) {
        await supabase.from("automation_logs").insert({ rule_id: confirmedRule.id, booking_id: invoice.booking_id, triggered_at: now, status: "pending" }).catch(() => null);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError({ message: `mark-paid failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
    return NextResponse.json({ success: false, error: "Failed to mark as paid" }, { status: 500 });
  }
}
