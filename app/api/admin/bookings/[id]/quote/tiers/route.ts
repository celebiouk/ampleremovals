/**
 * POST /api/admin/bookings/[id]/quote/tiers — set the Standard/Premium totals
 * for a Removals booking's instant quote, and whether Premium is shown to the
 * customer at all (bookings.show_premium_quote). Optionally sends it
 * straight away (email + SMS + WhatsApp, respecting the toggle) and advances
 * the booking to "Quote Sent" — see lib/bookings/quoteDelivery.ts.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { markQuoteSent, sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { logError } from "@/lib/log-error";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as {
    standardTotal?: number;
    premiumTotal?: number | null;
    showPremium?: boolean;
    send?: boolean;
  } | null;
  const standardTotal = Number(body?.standardTotal);
  if (!Number.isFinite(standardTotal) || standardTotal <= 0) {
    return NextResponse.json({ success: false, error: "Enter a valid Standard price" }, { status: 400 });
  }
  const showPremium = body?.showPremium !== false;
  const premiumTotal = showPremium && body?.premiumTotal != null && Number.isFinite(Number(body.premiumTotal)) && Number(body.premiumTotal) > 0
    ? Number(body.premiumTotal)
    : null; // null = fall back to the auto multiplier (see buildQuoteAssets)

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, reference, status, inventory, customer:customers!inner(full_name, email, phone)")
    .eq("id", params.id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ quote_total: standardTotal, quote_premium_total: premiumTotal, show_premium_quote: showPremium })
    .eq("id", params.id);
  if (updateError) return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    booking_id: params.id,
    action: `Quote tiers set: Standard £${standardTotal.toFixed(2)}${showPremium ? ` / Premium ${premiumTotal != null ? `£${premiumTotal.toFixed(2)}` : "(auto)"}` : " (Premium hidden from customer)"}`,
    metadata: { standardTotal, premiumTotal, showPremium },
    performed_by: "admin",
  });

  if (!body?.send) {
    return NextResponse.json({ success: true, sent: false });
  }

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  if (!customer?.email || !customer?.phone) {
    return NextResponse.json({ success: false, error: "Customer is missing an email or phone — saved but not sent" }, { status: 400 });
  }

  const token = generateQuoteConfirmToken(params.id);
  if (!token) {
    return NextResponse.json({ success: false, error: "Quote links aren't configured (QUOTE_CONFIRM_SECRET missing) — saved but not sent" }, { status: 500 });
  }

  try {
    await markQuoteSent(supabase, params.id, booking.status as string);
    await sendReserveMessages({
      bookingId: params.id,
      token,
      reference: booking.reference as string,
      firstName: (customer.full_name ?? "there").split(" ")[0],
      email: customer.email,
      phone: customer.phone,
      total: standardTotal,
      inventory: booking.inventory,
      showPremium,
    });
  } catch (err) {
    await logError({ message: `quote/tiers send failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { bookingId: params.id } });
    return NextResponse.json({ success: false, error: "Saved, but sending failed — try again" }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: true });
}
