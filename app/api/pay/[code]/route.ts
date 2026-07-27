import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { BANK_DETAILS, BANK_DETAILS_CONFIGURED } from "@/lib/deposit";

export const runtime = "nodejs";

/**
 * GET /api/pay/[code] — resolve a short pay-code to its invoice so the customer
 * can see the amount, reference and bank details. Public (the code is the key).
 */
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, status, type, customer:customers(full_name), booking:bookings(reference)")
      .eq("pay_code", params.code)
      .maybeSingle();
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Payment link not found" }, { status: 404 });
    }
    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
    const booking = Array.isArray(invoice.booking) ? invoice.booking[0] : invoice.booking;

    return NextResponse.json({
      success: true,
      firstName: (customer?.full_name ?? "there").split(" ")[0],
      // The payment reference the customer should use is the invoice number.
      reference: invoice.invoice_number,
      bookingReference: booking?.reference ?? null,
      amount: Number(invoice.total) || 0,
      paid: invoice.status === "paid",
      bank: BANK_DETAILS_CONFIGURED ? BANK_DETAILS : null,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
