import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { voidStripePaymentLink } from "@/lib/stripe-invoice";
import { logError } from "@/lib/log-error";

const schema = z.object({ reason: z.string().optional() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { reason } = schema.parse(body);
  const invoiceId = params.id;
  const supabase = createAdminClient();

  try {
    const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
    if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "paid") return NextResponse.json({ success: false, error: "Cannot void a paid invoice" }, { status: 400 });

    // Deactivate Stripe Payment Link
    if (invoice.stripe_payment_link) {
      try { await voidStripePaymentLink(invoice.stripe_payment_link); } catch { /* best effort */ }
    }

    await supabase.from("invoices").update({
      status: "cancelled",
      voided_at: new Date().toISOString(),
      void_reason: reason ?? null,
    }).eq("id", invoiceId);

    await supabase.from("activity_log").insert({
      booking_id: invoice.booking_id,
      action: `Invoice ${invoice.invoice_number} voided${reason ? ": " + reason : ""}`,
      metadata: { invoiceId, invoiceNumber: invoice.invoice_number },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError({ message: `void invoice failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
    return NextResponse.json({ success: false, error: "Failed to void invoice" }, { status: 500 });
  }
}
