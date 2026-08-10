import { NextRequest, NextResponse } from "next/server";
import { RemovalsFormSchema } from "@/lib/schemas/booking";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { completeLead } from "@/lib/bookings/completeLead";
import { sendReserveMessages } from "@/lib/bookings/quoteDelivery";
import { sendAdminNewBookingEmail, type NotificationPayload } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils";
import { logError } from "@/lib/log-error";

export const runtime = "nodejs";

/**
 * POST /api/admin/leads/complete
 * The ADMIN completing a lead on the customer's behalf (e.g. on a call). Same as
 * the public completion, but admin-authenticated and it accepts `adminPrice` — a
 * price the admin types in that becomes the quote total (overriding the
 * auto-estimate) so the figure emailed to the customer is the agreed one.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { bookingId, token, adminPrice } = (body as {
    bookingId?: string;
    token?: string;
    adminPrice?: number | string;
  }) ?? {};
  if (!bookingId) {
    return NextResponse.json({ success: false, error: "Missing booking." }, { status: 400 });
  }

  const parsed = RemovalsFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Please check the details and try again." }, { status: 400 });
  }

  // The admin-typed price (optional — blank means fall back to the auto-estimate).
  const priceNum = typeof adminPrice === "string" ? Number(adminPrice) : adminPrice;
  const priceOverride = typeof priceNum === "number" && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : undefined;

  try {
    const { reference, customerId, quoteTotal } = await completeLead(bookingId, parsed.data, { priceOverride });
    const d = parsed.data;

    // Record who did this and whether the price was set by hand.
    try {
      await createAdminClient().from("activity_log").insert({
        booking_id: bookingId,
        action: priceOverride != null
          ? `Lead completed by admin — quote set to ${formatCurrency(quoteTotal)}`
          : "Lead completed by admin (auto-estimated price)",
        metadata: { manual_price: priceOverride ?? null, quote_total: quoteTotal },
        performed_by: "admin",
      });
    } catch { /* non-critical */ }

    // Same customer + admin notifications as a normal completion — the customer
    // gets their quote (now the agreed price) + reserve link. Best-effort.
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
        token: token ?? "",
        reference,
        firstName: d.fullName.split(" ")[0],
        email: d.email,
        phone: d.phone,
        total: quoteTotal,
        inventory: d.inventory,
      }),
    ]);

    return NextResponse.json({ success: true, reference, bookingId, quoteToken: token ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logError({ message: `admin lead completion failed: ${message}`, metadata: { bookingId } });
    return NextResponse.json(
      { success: false, error: "We couldn't save the details. Please try again." },
      { status: 500 }
    );
  }
}
