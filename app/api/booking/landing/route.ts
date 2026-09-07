import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/bookings/createBooking";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { sendAdminNewBookingEmail, type NotificationPayload } from "@/lib/notifications";
import { sendBookingSummaryEmail } from "@/lib/booking-summary-email";
import { buildRemovalsSummary } from "@/lib/bookings/summary-input";
import { RemovalsFormSchema, InventorySelectionSchema, postcodeSchema, ukPhoneSchema } from "@/lib/schemas/booking";
import { logError } from "@/lib/log-error";
import type { RemovalsForm } from "@/lib/schemas/booking";

export const runtime = "nodejs";

/**
 * POST /api/booking/landing — the Meta-ad landing wizard's submit. A deliberately
 * lean, postcode-only house move (no address lookup, no domestic/business choice).
 * We shape it into a standard Removals booking so it reuses the whole pipeline
 * (quote, lead score, driver app, emails) and lands on the normal quote page to
 * reserve + pay.
 */
const LandingSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: ukPhoneSchema,
  originPostcode: postcodeSchema,
  destinationPostcode: postcodeSchema,
  bedrooms: z.enum(["studio", "1", "2", "3", "4", "5+"]),
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
  const form: RemovalsForm = RemovalsFormSchema.parse({
    removalType: "domestic",
    originPostcode: d.originPostcode,
    originAddress: { line_1: d.originPostcode, postcode: d.originPostcode },
    propertyType: "house",
    bedrooms: d.bedrooms,
    destinationPostcode: d.destinationPostcode,
    destinationAddress: { line_1: d.destinationPostcode, postcode: d.destinationPostcode },
    additionalServices: { packing_services: false, packing_materials: false, disassemble_furniture: false, assemble_furniture: false },
    description: `House move (${bedroomsLabel}) from ${d.originPostcode} to ${d.destinationPostcode}, booked online.`,
    inventory: d.inventory,
    isFlexibleDate: d.isFlexibleDate,
    moveDate: d.moveDate,
    flexibleDateFrom: d.flexibleDateFrom,
    flexibleDateTo: d.flexibleDateTo,
    fullName: d.fullName,
    email: d.email,
    phone: d.phone,
  });

  let reference: string, bookingId: string, customerId: string, quoteTotal: number | null | undefined;
  try {
    ({ reference, bookingId, customerId, quoteTotal } = await createBooking("removals", form, rawAttribution));
  } catch (err) {
    await logError({ message: `landing booking failed: ${err instanceof Error ? err.message : "unknown"}`, metadata: {} });
    return NextResponse.json(
      { success: false, error: "We couldn't submit your booking. Please try again or call 0333 577 2070." },
      { status: 500 }
    );
  }

  const quoteToken = generateQuoteConfirmToken(bookingId);

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
