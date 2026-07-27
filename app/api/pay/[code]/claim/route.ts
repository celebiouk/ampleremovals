import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, resendAdminEmails } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * POST /api/pay/[code]/claim — the customer taps "I've made the payment" on the
 * pay page. Records the claim + alerts the team to verify the bank transfer. We
 * never auto-mark the invoice paid — a human confirms the money landed.
 */
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, booking_id, customer:customers(full_name)")
      .eq("pay_code", params.code)
      .maybeSingle();
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Payment link not found" }, { status: 404 });
    }
    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
    const amount = formatCurrency(Number(invoice.total) || 0);

    if (invoice.booking_id) {
      await supabase.from("activity_log").insert({
        booking_id: invoice.booking_id,
        action: `Customer says they've paid balance invoice ${invoice.invoice_number}`,
        metadata: { invoice_number: invoice.invoice_number, total: invoice.total },
        performed_by: "customer",
      });
      try {
        await supabase.from("notifications").insert({
          type: "payment_claimed",
          title: "Balance payment claimed",
          description: `${customer?.full_name ?? "A customer"} says they've paid ${amount} (${invoice.invoice_number}). Verify the transfer.`,
          booking_id: invoice.booking_id,
          is_read: false,
        });
      } catch { /* non-critical */ }
    }

    await Promise.allSettled([
      sendEmail({
        to: resendAdminEmails,
        subject: `💷 Balance payment claimed — verify (${invoice.invoice_number})`,
        html: `<p><strong>${customer?.full_name ?? "A customer"}</strong> says they've paid ${amount} for invoice <strong>${invoice.invoice_number}</strong>.</p><p>Please check the bank account and mark the invoice paid once confirmed.</p>`,
      }),
      process.env.NEXT_PUBLIC_ADMIN_PHONE
        ? sendSMS(process.env.NEXT_PUBLIC_ADMIN_PHONE, `Balance claimed: ${customer?.full_name ?? "Customer"} paid ${amount} for ${invoice.invoice_number}. Verify the transfer.`)
        : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
