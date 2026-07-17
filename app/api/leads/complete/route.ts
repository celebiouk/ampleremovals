import { NextRequest, NextResponse } from "next/server";
import { RemovalsFormSchema } from "@/lib/schemas/booking";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { completeLead } from "@/lib/bookings/completeLead";
import { sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { sendAdminNewBookingEmail, type NotificationPayload } from "@/lib/notifications";
import { logError } from "@/lib/log-error";

export const runtime = "nodejs";

const TOKEN_EXPIRY_HOURS = 24 * 30;

/**
 * POST /api/leads/complete
 * A customer finishing an admin-created Removals lead. Public, authorised by the
 * signed token embedded in their completion link. Validates the full wizard
 * payload, updates the existing booking, and returns { reference } so the client
 * can jump to the quote page.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { bookingId, token } = (body as { bookingId?: string; token?: string }) ?? {};
  if (!bookingId || !token) {
    return NextResponse.json({ success: false, error: "Missing booking or token." }, { status: 400 });
  }
  if (!verifyQuoteConfirmToken(bookingId, token, TOKEN_EXPIRY_HOURS)) {
    return NextResponse.json({ success: false, error: "This link is invalid or has expired." }, { status: 401 });
  }

  const parsed = RemovalsFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Please check your details and try again." }, { status: 400 });
  }

  try {
    const { reference, customerId, quoteTotal } = await completeLead(bookingId, parsed.data);
    const d = parsed.data;

    // Notify the admin (like a normal new booking) and send the customer their
    // quote + reserve link. Best-effort — never blocks the response.
    const notifPayload: NotificationPayload = {
      bookingId,
      customerId,
      reference,
      serviceType: "removals",
      customerName: d.fullName,
      email: d.email,
      phone: d.phone,
      originAddress: d.originAddress ?? null,
      destinationAddress: d.destinationAddress ?? null,
      moveDate: d.moveDate ? String(d.moveDate) : null,
      isFlexibleDate: Boolean(d.isFlexibleDate),
      flexibleDateFrom: d.flexibleDateFrom ? String(d.flexibleDateFrom) : null,
      flexibleDateTo: d.flexibleDateTo ? String(d.flexibleDateTo) : null,
      description: d.description ?? null,
      additionalServices: {
        packingServices: d.additionalServices.packing_services,
        packingMaterials: d.additionalServices.packing_materials,
        disassembleFurniture: d.additionalServices.disassemble_furniture,
        assembleFurniture: d.additionalServices.assemble_furniture,
      },
    };
    await Promise.allSettled([
      sendAdminNewBookingEmail(notifPayload),
      sendReserveMessages({
        bookingId,
        token,
        reference,
        firstName: d.fullName.split(" ")[0],
        email: d.email,
        phone: d.phone,
        total: quoteTotal,
      }),
    ]);

    return NextResponse.json({ success: true, reference, bookingId, quoteToken: token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logError({ message: `lead completion failed: ${message}`, metadata: { bookingId } });
    return NextResponse.json(
      { success: false, error: "We couldn't save your details. Please try again or call us on 0333 577 2070." },
      { status: 500 }
    );
  }
}
