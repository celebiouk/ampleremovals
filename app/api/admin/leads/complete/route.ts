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
 * the public completion, but admin-authenticated and it accepts `standardPrice`
 * and/or `premiumPrice` — figures the admin types in that become exactly what
 * the customer sees and pays for that package (the customer still picks Standard
 * or Premium themselves; this only fixes the price of each).
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

  const { bookingId, token, standardPrice, premiumPrice } = (body as {
    bookingId?: string;
    token?: string;
    standardPrice?: number | string;
    premiumPrice?: number | string;
  }) ?? {};
  if (!bookingId) {
    return NextResponse.json({ success: false, error: "Missing booking." }, { status: 400 });
  }

  const parsed = RemovalsFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Please check the details and try again." }, { status: 400 });
  }

  // The admin-typed prices (optional — blank falls back to the suggested price).
  const toNum = (v: number | string | undefined): number | undefined => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const standardPriceOverride = toNum(standardPrice);
  const premiumPriceOverride = toNum(premiumPrice);

  try {
    const { reference, customerId, quoteTotal } = await completeLead(bookingId, parsed.data, { standardPriceOverride, premiumPriceOverride });
    const d = parsed.data;

    // Record who did this and whether the prices were set by hand.
    try {
      await createAdminClient().from("activity_log").insert({
        booking_id: bookingId,
        action: standardPriceOverride != null || premiumPriceOverride != null
          ? `Lead completed by admin — Standard ${formatCurrency(standardPriceOverride ?? quoteTotal)}${premiumPriceOverride != null ? `, Premium ${formatCurrency(premiumPriceOverride)}` : ""}`
          : "Lead completed by admin (auto-estimated prices)",
        metadata: { standard_price: standardPriceOverride ?? null, premium_price: premiumPriceOverride ?? null, quote_total: quoteTotal },
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
