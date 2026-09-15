import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { sendCustomerConfirmationEmail, sendCustomerConfirmationSMS, sendCustomerConfirmationWhatsApp, type NotificationPayload } from "@/lib/notifications";
import type { ServiceType, AddressOption } from "@/types";

export const runtime = "nodejs";
const TOKEN_EXPIRY_HOURS = 24 * 30;

/**
 * POST /api/booking/notify — sends the customer's booking-received
 * confirmation (email+SMS+WhatsApp, no price — see lib/business-hours.ts),
 * reconstructed from the stored booking.
 *
 * This is deliberately NOT called at submit time. Instead the quote page (and
 * the plain confirmation page) call it after the customer has been on the page
 * ~60 seconds, or immediately via a page-unload beacon if they navigate away
 * sooner — either way the customer still gets their message, it just doesn't
 * land the literal instant they hit submit. Idempotent: a `customer_notified_at`
 * claim means the timer AND an unload beacon firing together can't double-send.
 */
export async function POST(req: NextRequest) {
  let body: { bookingId?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
  const { bookingId, token } = body;
  if (!bookingId || !token || !verifyQuoteConfirmToken(bookingId, token, TOKEN_EXPIRY_HOURS)) {
    return NextResponse.json({ success: false, error: "Invalid or expired link." }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Claim it — only the first caller (timer or unload beacon) actually sends.
  const { data: claimed } = await supabase
    .from("bookings")
    .update({ customer_notified_at: new Date().toISOString() })
    .eq("id", bookingId)
    .is("customer_notified_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return NextResponse.json({ success: true, alreadySent: true });

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, reference, service_type, customer_id, quote_total, description, inventory,
      floor, has_lift, parking_within_20m, special_instructions,
      dest_floor, dest_has_lift, dest_parking_within_20m, dest_access_notes,
      move_date, is_flexible_date, flexible_date_from, flexible_date_to,
      customer:customers!inner(full_name, email, phone),
      origin:addresses!origin_address_id(line_1, line_2, city, postcode),
      destination:addresses!destination_address_id(line_1, line_2, city, postcode),
      removals_details(property_type, bedrooms),
      additional_services(packing_services, packing_materials, disassemble_furniture, assemble_furniture, packing_hours, packing_men, dismantle_count, assemble_count)
    `)
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  if (!customer?.email) return NextResponse.json({ success: true }); // nothing to send to

  // Same price-free "you've been assigned" message for every service type —
  // removals used to get a priced quote email here (sendReserveMessages); that
  // no longer happens anywhere in this flow, see lib/business-hours.ts.
  const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin;
  const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination;
  const notif: NotificationPayload = {
    bookingId,
    customerId: booking.customer_id as string,
    reference: booking.reference as string,
    serviceType: booking.service_type as ServiceType,
    customerName: customer.full_name ?? "",
    email: customer.email,
    phone: customer.phone,
    originAddress: (origin as AddressOption) ?? null,
    destinationAddress: (destination as AddressOption) ?? null,
    moveDate: booking.move_date,
    isFlexibleDate: Boolean(booking.is_flexible_date),
    flexibleDateFrom: booking.flexible_date_from,
    flexibleDateTo: booking.flexible_date_to,
    description: booking.description,
    additionalServices: null,
  };
  await Promise.allSettled([
    sendCustomerConfirmationEmail(notif),
    sendCustomerConfirmationSMS(notif),
    sendCustomerConfirmationWhatsApp(notif),
  ]);

  return NextResponse.json({ success: true });
}
