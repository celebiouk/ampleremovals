import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/bookings/createBooking";
import { completeLead } from "@/lib/bookings/completeLead";
import { generateQuoteConfirmToken, verifyQuoteConfirmToken } from "@/lib/tokens";
import { sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { sendAdminNewBookingEmail, type NotificationPayload } from "@/lib/notifications";
import { sendBookingSummaryEmail } from "@/lib/booking-summary-email";
import { buildRemovalsSummary } from "@/lib/bookings/summary-input";
import { RemovalsFormSchema, InventorySelectionSchema, AddressOptionSchema, postcodeSchema, ukPhoneSchema } from "@/lib/schemas/booking";
import { logError } from "@/lib/log-error";
import type { RemovalsForm } from "@/lib/schemas/booking";

const TOKEN_EXPIRY_HOURS = 24 * 30;

export const runtime = "nodejs";

/**
 * POST /api/booking/landing — the Meta-ad landing wizard's submit. A deliberately
 * lean, postcode-only house move (no address lookup, no domestic/business choice).
 * We shape it into a standard Removals booking so it reuses the whole pipeline
 * (quote, lead score, driver app, emails) and lands on the normal quote page to
 * reserve + pay.
 */
const LandingSchema = z.object({
  // When present, we COMPLETE the enquiry created by /start (status → quote sent)
  // rather than creating a fresh booking.
  bookingId: z.string().uuid().optional(),
  token: z.string().optional(),
  fullName: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: ukPhoneSchema,
  originPostcode: postcodeSchema,
  destinationPostcode: postcodeSchema,
  // Full addresses when the customer picked from the list (else postcode-only).
  originAddress: AddressOptionSchema.optional(),
  destinationAddress: AddressOptionSchema.optional(),
  propertyType: z.enum(["house", "flat", "bungalow"]).optional().default("house"),
  bedrooms: z.enum(["studio", "1", "2", "3", "4", "5+"]),
  // Per-address access (floor is "ground" or a number of flights).
  floor: z.string().trim().max(20).optional(),
  parkingWithin20m: z.boolean().optional(),
  destFloor: z.string().trim().max(20).optional(),
  destParkingWithin20m: z.boolean().optional(),
  description: z.string().trim().max(1000).optional(),
  inventory: z.array(InventorySelectionSchema).optional().default([]),
  isFlexibleDate: z.boolean().optional().default(false),
  moveDate: z.coerce.date().optional(),
  flexibleDateFrom: z.coerce.date().optional(),
  flexibleDateTo: z.coerce.date().optional(),
});

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = LandingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Please check your details and try again." }, { status: 400 });
  }
  const d = parsed.data;
  const rawAttribution = (raw as { attribution?: Record<string, string> } | null)?.attribution ?? null;

  // Shape into a full Removals form — house move assumed, postcode used as the
  // address line (no paid address lookup). Description is synthesised so it meets
  // the shared schema and reads sensibly in the admin CRM.
  const bedroomsLabel = d.bedrooms === "studio" ? "studio" : `${d.bedrooms}-bedroom`;
  // Description: use the customer's words; if too short for the shared schema
  // (min 20), append a synthesised sentence so it always validates + reads well.
  const userDesc = (d.description ?? "").trim();
  const synth = `House move (${bedroomsLabel}) from ${d.originPostcode} to ${d.destinationPostcode}, booked online.`;
  const description = userDesc.length >= 20 ? userDesc : userDesc ? `${userDesc} — ${synth}` : synth;

  // Use the picked address if we have a real street line; else postcode-only.
  const originAddress = d.originAddress?.line_1 ? d.originAddress : { line_1: d.originPostcode, postcode: d.originPostcode };
  const destinationAddress = d.destinationAddress?.line_1 ? d.destinationAddress : { line_1: d.destinationPostcode, postcode: d.destinationPostcode };

  const form: RemovalsForm = RemovalsFormSchema.parse({
    removalType: "domestic",
    originPostcode: d.originPostcode,
    originAddress,
    propertyType: d.propertyType,
    bedrooms: d.bedrooms,
    destinationPostcode: d.destinationPostcode,
    destinationAddress,
    additionalServices: { packing_services: false, packing_materials: false, disassemble_furniture: false, assemble_furniture: false },
    description,
    inventory: d.inventory,
    floor: d.floor,
    parkingWithin20m: d.parkingWithin20m,
    destFloor: d.destFloor,
    destParkingWithin20m: d.destParkingWithin20m,
    isFlexibleDate: d.isFlexibleDate,
    moveDate: d.moveDate,
    flexibleDateFrom: d.flexibleDateFrom,
    flexibleDateTo: d.flexibleDateTo,
    fullName: d.fullName,
    email: d.email,
    phone: d.phone,
  });

  // Complete the pre-created enquiry (status → quote sent) when we have its id +
  // a valid token; otherwise create a fresh booking (fallback).
  const completing = Boolean(d.bookingId && d.token && verifyQuoteConfirmToken(d.bookingId, d.token, TOKEN_EXPIRY_HOURS));
  let reference: string, bookingId: string, customerId: string, quoteTotal: number | null | undefined;
  try {
    if (completing) {
      const r = await completeLead(d.bookingId!, form);
      ({ reference, bookingId, customerId, quoteTotal } = r);
    } else {
      ({ reference, bookingId, customerId, quoteTotal } = await createBooking("removals", form, rawAttribution));
    }
  } catch (err) {
    await logError({ message: `landing booking failed: ${err instanceof Error ? err.message : "unknown"}`, metadata: {} });
    return NextResponse.json(
      { success: false, error: "We couldn't submit your booking. Please try again or call 0333 577 2070." },
      { status: 500 }
    );
  }

  const quoteToken = d.token && completing ? d.token : generateQuoteConfirmToken(bookingId);

  // Notifications — never block the response.
  const notifPayload: NotificationPayload = {
    bookingId, customerId, reference, serviceType: "removals",
    customerName: d.fullName, email: d.email, phone: d.phone,
    originAddress: form.originAddress, destinationAddress: form.destinationAddress,
    moveDate: d.moveDate ? String(d.moveDate) : null,
    isFlexibleDate: Boolean(d.isFlexibleDate),
    flexibleDateFrom: d.flexibleDateFrom ? String(d.flexibleDateFrom) : null,
    flexibleDateTo: d.flexibleDateTo ? String(d.flexibleDateTo) : null,
    description: form.description,
    additionalServices: null,
  };
  await Promise.allSettled([
    sendAdminNewBookingEmail(notifPayload),
    sendBookingSummaryEmail(buildRemovalsSummary(form, reference, quoteTotal ?? null)),
    quoteToken
      ? sendReserveMessages({
          bookingId, token: quoteToken, reference,
          firstName: d.fullName.split(" ")[0], email: d.email, phone: d.phone,
          total: quoteTotal ?? 0, inventory: d.inventory,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true, reference, bookingId, quoteToken });
}
