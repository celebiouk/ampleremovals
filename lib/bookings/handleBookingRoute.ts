import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { createBooking } from "@/lib/bookings/createBooking";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { logError } from "@/lib/log-error";
import { sendAdminNewBookingEmail, type NotificationPayload } from "@/lib/notifications";
import { markQuoteSent, sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { createAdminClient } from "@/lib/supabase/server";
import type { ServiceType } from "@/types";
import type { AnyBookingForm } from "@/lib/schemas/booking";

/** Services that now get an instant price at the end of the main wizard
 *  (reversing the earlier "never show a price on the main wizard" decision —
 *  see createBooking.ts 5b/5c). Every other service keeps the old behaviour:
 *  plain confirmation, price comes later from an admin-built quote. */
const INSTANT_QUOTE_SERVICES = new Set<ServiceType>(["removals", "man_and_van"]);

/**
 * Shared booking-submission handler: validates, persists, fires notifications,
 * and returns { success, reference, bookingId }.
 */
export async function handleBookingRoute(
  request: NextRequest,
  serviceType: ServiceType,
  schema: z.ZodTypeAny
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Please check your details and try again." },
      { status: 400 }
    );
  }

  const data = parsed.data as AnyBookingForm;

  // Attribution is sent alongside the form but isn't part of the per-service
  // Zod schema (which strips it), so read it from the raw body.
  const rawAttribution = (body as { attribution?: Record<string, string> } | null)?.attribution ?? null;

  let reference: string;
  let bookingId: string;
  let customerId: string;
  let quoteTotal: number | null | undefined;

  try {
    ({ reference, bookingId, customerId, quoteTotal } = await createBooking(serviceType, data, rawAttribution));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logError({
      message: `booking submission failed (${serviceType}): ${message}`,
      metadata: { serviceType },
    });
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't submit your booking right now. Please try again or call us on 0333 577 2070.",
      },
      { status: 500 }
    );
  }

  // Build notification payload from validated form data
  const notifPayload: NotificationPayload = {
    bookingId,
    customerId,
    reference,
    serviceType,
    customerName: data.fullName,
    email: data.email,
    phone: data.phone,
    originAddress: data.originAddress ?? null,
    destinationAddress: "destinationAddress" in data ? (data.destinationAddress ?? null) : null,
    moveDate: "moveDate" in data && data.moveDate ? String(data.moveDate) : null,
    moveTime: "moveTime" in data && data.moveTime ? String(data.moveTime) : null,
    isFlexibleDate: "isFlexibleDate" in data ? Boolean(data.isFlexibleDate) : false,
    flexibleDateFrom: "flexibleDateFrom" in data && data.flexibleDateFrom ? String(data.flexibleDateFrom) : null,
    flexibleDateTo: "flexibleDateTo" in data && data.flexibleDateTo ? String(data.flexibleDateTo) : null,
    description: "description" in data ? (data.description as string) : null,
    additionalServices: "additionalServices" in data
      ? (data.additionalServices as NotificationPayload["additionalServices"])
      : null,
  };

  // A signed token lets the customer view + reserve their quote and claim the
  // deposit without logging in. Null if QUOTE_CONFIRM_SECRET isn't set — the
  // client then falls back to the plain confirmation page.
  const quoteToken = generateQuoteConfirmToken(bookingId);

  // Admin alert fires immediately. The CUSTOMER-facing confirmation is NOT sent
  // here at all — the quote/confirmation page the browser is redirected to
  // triggers it itself via /api/booking/notify after ~60s (or sooner via a
  // page-unload beacon), so it lands after they've had a moment to read the
  // rest of the booking screen, not the instant they hit submit.
  await sendAdminNewBookingEmail(notifPayload);

  // Removals and Man and Van now get an instant price: mark the quote sent
  // and fire the "your quote is ready" email/SMS (+ queued WhatsApp) right
  // away, same as the location-page instant-quote routes, then tell the
  // client to land on the quote page instead of the plain confirmation page.
  let quoteReady = false;
  if (INSTANT_QUOTE_SERVICES.has(serviceType) && quoteToken && quoteTotal != null) {
    try {
      const supabase = createAdminClient();
      await markQuoteSent(supabase, bookingId, "inquiry");
      await sendReserveMessages({
        bookingId,
        token: quoteToken,
        reference,
        firstName: data.fullName.trim().split(/\s+/)[0] || data.fullName.trim(),
        email: data.email,
        phone: data.phone,
        total: quoteTotal,
        showStandard: true,
        showPremium: true,
      });
      quoteReady = true;
    } catch (e) {
      console.warn(`instant quote notify failed (${serviceType}):`, e);
    }
  }

  return NextResponse.json({ success: true, reference, bookingId, quoteToken, quoteReady });
}
