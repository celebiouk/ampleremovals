/**
 * POST /api/quote/instant-removals — self-serve instant quote for a full
 * house removal, reached from a House Removals location page. Uses the same
 * bedroom-band pricing (lib/quote-engine.ts) and Standard/Premium multiplier
 * (lib/tiers.ts) as the rest of the site, then creates a real booking and
 * sends the customer straight to the existing Standard/Premium reveal +
 * deposit-payment page (/quote/[bookingId]/[token]) — no admin in the loop.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { insertAddress } from "@/lib/bookings/createBooking";
import { markQuoteSent, sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { DEPOSIT_PERCENTAGE } from "@/lib/deposit";
import { buildQuote } from "@/lib/quote-engine";
import { premiumTotalFor } from "@/lib/tiers";
import type { AddressOption } from "@/types";

export const runtime = "nodejs";

const VALID_BEDROOMS = new Set(["studio", "1", "2", "3", "4", "5+"]);

interface Body {
  bedrooms: string;
  fullName: string;
  email: string;
  phone: string;
  address: AddressOption;
  moveDate: string; // YYYY-MM-DD
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Body | null;
  if (!body) return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });

  if (!body.bedrooms || !VALID_BEDROOMS.has(body.bedrooms)) {
    return NextResponse.json({ success: false, error: "Pick the size of your home" }, { status: 400 });
  }
  if (!body.fullName?.trim() || !body.email?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ success: false, error: "Name, email and phone are required" }, { status: 400 });
  }
  if (!body.address?.postcode?.trim()) {
    return NextResponse.json({ success: false, error: "A postcode is required" }, { status: 400 });
  }
  if (!body.moveDate) {
    return NextResponse.json({ success: false, error: "Pick a date" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .upsert({ full_name: body.fullName.trim(), email: body.email.trim().toLowerCase(), phone: body.phone.trim() }, { onConflict: "email" })
    .select("id")
    .single();
  if (customerError || !customer) {
    return NextResponse.json({ success: false, error: `Couldn't save your details: ${customerError?.message}` }, { status: 500 });
  }

  let originAddressId: string;
  try {
    originAddressId = await insertAddress(supabase, body.address);
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Couldn't save address" }, { status: 500 });
  }

  const quote = buildQuote({ bedrooms: body.bedrooms });
  const standardTotal = quote.total;
  const premiumTotal = premiumTotalFor(standardTotal);
  const reference = generateBookingReference("removals");

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: "removals",
      customer_id: customer.id,
      status: "inquiry",
      origin_address_id: originAddressId,
      move_date: body.moveDate,
      quote_total: standardTotal,
      quote_premium_total: premiumTotal,
      show_standard_quote: true,
      show_premium_quote: true,
      deposit_percentage: DEPOSIT_PERCENTAGE,
      source: "location_page_instant_quote",
      description: `Instant quote: ${body.bedrooms === "studio" ? "studio" : `${body.bedrooms} bedroom`} removal.`,
    })
    .select("id")
    .single();
  if (bookingError || !booking) {
    return NextResponse.json({ success: false, error: `Couldn't create booking: ${bookingError?.message}` }, { status: 500 });
  }

  const token = generateQuoteConfirmToken(booking.id);
  if (!token) {
    return NextResponse.json({ success: false, error: "Quote links aren't configured" }, { status: 500 });
  }

  await markQuoteSent(supabase, booking.id, "inquiry");

  await sendReserveMessages({
    bookingId: booking.id,
    token,
    reference,
    firstName: body.fullName.trim().split(/\s+/)[0] || body.fullName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
    total: standardTotal,
    showStandard: true,
    showPremium: true,
  }).catch((e) => console.warn("instant-removals reserve messages failed:", e));

  return NextResponse.json({ success: true, bookingId: booking.id, token, reference });
}
