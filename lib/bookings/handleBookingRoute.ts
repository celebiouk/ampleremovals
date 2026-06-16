import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { createBooking } from "@/lib/bookings/createBooking";
import { logError } from "@/lib/log-error";
import {
  sendCustomerConfirmationEmail,
  sendAdminNewBookingEmail,
  sendCustomerConfirmationSMS,
  type NotificationPayload,
} from "@/lib/notifications";
import type { ServiceType } from "@/types";
import type { AnyBookingForm } from "@/lib/schemas/booking";

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

  try {
    ({ reference, bookingId, customerId } = await createBooking(serviceType, data, rawAttribution));
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
    isFlexibleDate: "isFlexibleDate" in data ? Boolean(data.isFlexibleDate) : false,
    flexibleDateFrom: "flexibleDateFrom" in data && data.flexibleDateFrom ? String(data.flexibleDateFrom) : null,
    flexibleDateTo: "flexibleDateTo" in data && data.flexibleDateTo ? String(data.flexibleDateTo) : null,
    description: "description" in data ? (data.description as string) : null,
    additionalServices: "additionalServices" in data
      ? (data.additionalServices as NotificationPayload["additionalServices"])
      : null,
  };

  // Fire all 3 notifications in parallel — failures never block the response
  await Promise.allSettled([
    sendCustomerConfirmationEmail(notifPayload),
    sendAdminNewBookingEmail(notifPayload),
    sendCustomerConfirmationSMS(notifPayload),
  ]);

  return NextResponse.json({ success: true, reference, bookingId });
}
