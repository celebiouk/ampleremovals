import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe, stripeTest } from "@/lib/stripe";
import { cardTotalForNet } from "@/lib/stripe-fees";

export const runtime = "nodejs";

/**
 * POST /api/pay/[code]/checkout — create a Stripe Checkout session for a
 * pay-code's invoice so the customer can pay by card. The payment intent carries
 * `invoice_id` in its metadata, which the Stripe webhook uses to mark the invoice
 * paid. Returns the hosted Checkout URL to redirect to.
 */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    // Test mode (?test=1) uses the Stripe test client so you can pay with test
    // card 4242… — no real money. Live is the default.
    const useTest = new URL(req.url).searchParams.get("test") === "1" && !!stripeTest;
    const client = useTest ? stripeTest! : stripe;
    if (!useTest && !process.env.STRIPE_SECRET_KEY) {
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

    const net = Number(invoice.total) || 0;
    const amountPence = Math.round(net * 100);
    if (!amountPence || amountPence < 30) return NextResponse.json({ success: false, error: "Invalid amount." }, { status: 400 });

    // Add Stripe's card fee on top so we net the full invoice amount. The fee is
    // a separate, clearly-labelled line the customer sees. (Bank transfer has no
    // such fee — this only applies to card.)
    const { fee } = cardTotalForNet(net);
    const feePence = Math.round(fee * 100);

    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";

    const line_items = [{
      price_data: {
        currency: "gbp",
        product_data: { name: `Ample Removals — Invoice ${invoice.invoice_number}` },
        unit_amount: amountPence,
      },
      quantity: 1,
    }];
    if (feePence > 0) {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Card processing fee (so your full payment reaches us)" },
          unit_amount: feePence,
        },
        quantity: 1,
      });
    }

    const session = await client.checkout.sessions.create({
      mode: "payment",
      line_items,
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
