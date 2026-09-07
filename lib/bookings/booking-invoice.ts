/**
 * Minimal invoice creation for CUSTOMER self-serve booking payments (deposit by
 * card, or full move via Klarna). Reuses the invoices table so the existing Stripe
 * webhook marks it paid and drives booking status, job confirmation and driver
 * earnings — no separate payment plumbing. Intentionally lighter than the admin
 * invoice generator (no PDF/storage): the customer pays from a Checkout link.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from "crypto";
import { generateInvoiceNumber } from "@/lib/utils";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface BookingInvoice {
  invoiceId: string;
  payCode: string;
  total: number;
}

/**
 * Return the live (non-cancelled) invoice of `type` for a booking, creating a
 * lean one for `net` if none exists. VAT-free single line — the amount is the
 * agreed quote figure.
 */
export async function getOrCreateBookingInvoice(
  supabase: any,
  opts: { bookingId: string; customerId: string; type: "deposit" | "full_balance"; net: number; description: string },
): Promise<BookingInvoice> {
  const { bookingId, customerId, type, net, description } = opts;

  const { data: existing } = await supabase
    .from("invoices")
    .select("id, pay_code, total, status")
    .eq("booking_id", bookingId)
    .eq("type", type)
    .neq("status", "cancelled")
    .neq("status", "paid")
    .maybeSingle();
  if (existing) {
    return { invoiceId: existing.id as string, payCode: (existing.pay_code as string) ?? "", total: Number(existing.total) || net };
  }

  const total = round2(net);

  // Unique invoice number + pay code.
  let invoiceNumber = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateInvoiceNumber();
    const { data: clash } = await supabase.from("invoices").select("id").eq("invoice_number", candidate).maybeSingle();
    if (!clash) { invoiceNumber = candidate; break; }
  }
  if (!invoiceNumber) throw new Error("couldn't generate invoice number");

  let payCode = "";
  for (let i = 0; i < 10; i++) {
    const candidate = randomBytes(5).toString("hex");
    const { data: clash } = await supabase.from("invoices").select("id").eq("pay_code", candidate).maybeSingle();
    if (!clash) { payCode = candidate; break; }
  }

  const dueDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0];

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      booking_id: bookingId,
      customer_id: customerId,
      type,
      status: "sent",
      line_items: [{ description, quantity: 1, unit_price: total, total }],
      subtotal: total,
      vat_rate: 0,
      vat_amount: 0,
      total,
      due_date: dueDate,
      pay_code: payCode || null,
    })
    .select("id")
    .single();
  if (error || !invoice) throw new Error(`invoice insert failed: ${error?.message}`);

  return { invoiceId: invoice.id as string, payCode, total };
}
