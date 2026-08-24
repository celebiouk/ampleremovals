import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/pay/[code]/checkout — create a Stripe Checkout session for a
 * pay-code's invoice so the customer can pay by card. The payment intent carries
 * `invoice_id` in its metadata, which the Stripe webhook uses to mark the invoice
 * paid. Returns the hosted Checkout URL to redirect to.
 */
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ success: false, error: "Card payments aren't set up yet." }, { status: 503 });
    }
    const supabase = createAdminClient();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, status, customer:customers(full_name, email)")
      .eq("pay_code", params.code)
      .maybeSingle();
    if (!invoice) return NextResponse.json({ success: false, error: "Payment link not found" }, { status: 404 });
    if (invoice.status === "paid") return NextResponse.json({ success: false, error: "This invoice is already paid." }, { status: 400 });

    const amount = Math.round(Number(invoice.total) * 100);
    if (!amount || amount < 30) return NextResponse.json({ success: false, error: "Invalid amount." }, { status: 400 });

    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: `Ample Removals — Invoice ${invoice.invoice_number}` },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      // The webhook keys off invoice_id on the PaymentIntent to mark it paid.
      payment_intent_data: { metadata: { invoice_id: invoice.id }, description: `Invoice ${invoice.invoice_number}` },
      metadata: { invoice_id: invoice.id, pay_code: params.code },
      customer_email: customer?.email ?? undefined,
      success_url: `${site}/pay/${params.code}?status=card_success`,
      cancel_url: `${site}/pay/${params.code}`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Couldn't start card payment." }, { status: 500 });
  }
}
