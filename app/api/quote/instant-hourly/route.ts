/**
 * POST /api/quote/instant-hourly — self-serve instant quote for a flat-rate
 * hourly job (Man and Van, House Clearance / Rubbish Removal), reached from
 * a location page. No admin involved: the price is hours × a fixed rate, so
 * a real booking + quote can be created immediately. Reuses the EXISTING
 * Standard/Premium reveal + deposit-payment flow (/quote/[bookingId]/[token])
 * rather than building new payment UI — House Clearance's two crew sizes
 * map onto Standard (1 man + van) / Premium (2 men) the same way Removals'
 * tiers already work; Man and Van has no Premium tier, just one flat rate.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { insertAddress } from "@/lib/bookings/createBooking";
import { markQuoteSent, sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { DEPOSIT_PERCENTAGE } from "@/lib/deposit";
import type { AddressOption } from "@/types";

export const runtime = "nodejs";

const MIN_HOURS = 2;
const RATES = {
  man_and_van: { standard: 45, premium: 75 }, // £/hr: 1 man + van / 2 men + van
  house_clearance: { standard: 45, premium: 70 }, // £/hr: 1 man + van / 2 men
} as const;

interface Body {
  service: "man_and_van" | "house_clearance";
  hours: number;
  fullName: string;
  email: string;
  phone: string;
  address: AddressOption;
  moveDate: string; // YYYY-MM-DD
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Body | null;
  if (!body) return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });

  const hours = Math.round(Number(body.hours));
  if (!Number.isFinite(hours) || hours < MIN_HOURS) {
    return NextResponse.json({ success: false, error: `Minimum booking is ${MIN_HOURS} hours` }, { status: 400 });
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
  const rates = RATES[body.service];
  if (!rates) return NextResponse.json({ success: false, error: "Unknown service" }, { status: 400 });

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

  const premiumRate = "premium" in rates ? rates.premium : null;
  const standardTotal = Math.round(hours * rates.standard * 100) / 100;
  const premiumTotal = premiumRate != null ? Math.round(hours * premiumRate * 100) / 100 : null;
  const reference = generateBookingReference(body.service);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: body.service,
      customer_id: customer.id,
      status: "inquiry",
      origin_address_id: originAddressId,
      move_date: body.moveDate,
      quote_total: standardTotal,
      quote_premium_total: premiumTotal,
      show_standard_quote: true,
      show_premium_quote: premiumTotal != null,
      deposit_percentage: DEPOSIT_PERCENTAGE,
      source: "location_page_instant_quote",
      description: `Instant hourly quote: ${hours} hours at £${rates.standard}/hr${premiumRate != null ? ` (£${premiumRate}/hr for 2 men)` : ""}.`,
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

  // Email + SMS + WhatsApp "your quote is ready, pay a deposit to secure your
  // date" — best-effort, never blocks the booking from completing.
  await sendReserveMessages({
    bookingId: booking.id,
    token,
    reference,
    firstName: body.fullName.trim().split(/\s+/)[0] || body.fullName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
    total: standardTotal,
    showStandard: true,
    showPremium: premiumTotal != null,
  }).catch((e) => console.warn("instant-hourly reserve messages failed:", e));

  return NextResponse.json({ success: true, bookingId: booking.id, token, reference });
}
