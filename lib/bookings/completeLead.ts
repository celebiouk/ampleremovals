import { createServiceClient } from "@/lib/supabase/server";
import { insertAddress } from "@/lib/bookings/createBooking";
import { markQuoteSent } from "@/lib/bookings/quoteDelivery";
import { buildQuote } from "@/lib/quote-engine";
import { depositFor } from "@/lib/deposit";
import { hasWhiteGoods } from "@/lib/inventory-catalog";
import { ukDateString } from "@/lib/dates";
import type { RemovalsForm } from "@/lib/schemas/booking";

const toDateString = (d?: Date | null): string | null => (d ? ukDateString(d) : null);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Optional overrides applied when an admin (not the customer) completes a lead. */
export interface CompleteLeadOptions {
  /**
   * A price the admin typed in themselves (they're on a call agreeing it). When
   * set, it becomes THE quote total — replacing the auto-estimate — and is stored
   * as a single non-removable line so the quote page, reserve step and 25%
   * deposit all stay consistent with the agreed figure.
   */
  priceOverride?: number;
}

export interface CompleteLeadResult {
  reference: string;
  bookingId: string;
  customerId: string;
  quoteTotal: number;
}

/**
 * Complete an admin-created Removals lead: the customer has filled in the rest of
 * the wizard, so we attach addresses, date, inventory, access and add-ons to the
 * EXISTING booking, compute the instant quote, and flip it off "partial lead".
 *
 * Mirrors createBooking's persistence but as an update to a booking that already
 * exists. Detail/extra rows are delete-then-insert so a repeat completion is safe.
 */
export async function completeLead(
  bookingId: string,
  data: RemovalsForm,
  opts?: CompleteLeadOptions
): Promise<CompleteLeadResult> {
  const supabase = createServiceClient();

  // 1. Load the lead (must exist) and its customer.
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, reference, customer_id, status")
    .eq("id", bookingId)
    .single();
  if (fetchErr || !booking) throw new Error(`lead not found: ${fetchErr?.message}`);
  const customerId = booking.customer_id as string;

  // 2. Refresh the customer's details (they may have corrected them).
  await supabase
    .from("customers")
    .update({ full_name: data.fullName, email: data.email, phone: data.phone })
    .eq("id", customerId);

  // 3. Addresses.
  const originAddressId = await insertAddress(supabase, data.originAddress);
  const destinationAddressId = data.destinationAddress
    ? await insertAddress(supabase, data.destinationAddress)
    : null;

  // 4. Date handling (specific vs flexible window).
  const isFlexible = Boolean(data.isFlexibleDate);
  const moveDate = isFlexible ? null : toDateString(data.moveDate);
  const flexFrom = isFlexible ? toDateString(data.flexibleDateFrom) : null;
  const flexTo = isFlexible ? toDateString(data.flexibleDateTo) : null;

  // 5. Inventory + quote.
  const inventory = Array.isArray(data.inventory) ? data.inventory : [];
  const whiteGoods = hasWhiteGoods(inventory);
  const quote = buildQuote({
    bedrooms: data.bedrooms,
    hasWhiteGoods: whiteGoods,
    packingHours: data.packingHours ?? 0,
    packingMen: data.packingMen ?? 1,
    dismantleCount: data.dismantleCount ?? 0,
    assembleCount: data.assembleCount ?? 0,
    eotCleaning: Boolean(data.wantsEotCleaning),
  });

  // Manual price (admin on a call) wins over the auto-estimate. Stored as one
  // non-removable line so total = reserve total = the agreed figure everywhere.
  const override = opts?.priceOverride;
  const useOverride = typeof override === "number" && Number.isFinite(override) && override > 0;
  const finalTotal = useOverride ? round2(override) : quote.total;
  const finalLines = useOverride
    ? [{ key: "base", description: "Removals service", quantity: 1, unit_price: finalTotal, total: finalTotal, removable: false }]
    : quote.lines;
  const finalDeposit = useOverride ? depositFor(finalTotal) : quote.depositAmount;

  // 6. Core booking update — addresses, date, description, quote. These columns
  // have always existed, so this must succeed for the completion to count.
  const { error: coreErr } = await supabase
    .from("bookings")
    .update({
      origin_address_id: originAddressId,
      destination_address_id: destinationAddressId,
      move_date: moveDate,
      is_flexible_date: isFlexible,
      flexible_date_from: flexFrom,
      flexible_date_to: flexTo,
      description: data.description ?? null,
      quote_line_items: finalLines,
      quote_subtotal: finalTotal,
      quote_total: finalTotal,
    })
    .eq("id", bookingId);
  if (coreErr) throw new Error(`lead completion failed: ${coreErr.message}`);

  // 6b. Newer instant-quote/logistics columns — best-effort (tolerant of an
  // un-applied migration, Lesson 11).
  try {
    await supabase
      .from("bookings")
      .update({
        floor: data.floor ?? null,
        has_lift: data.hasLift ?? null,
        parking_within_20m: data.parkingWithin20m ?? null,
        special_instructions: data.specialInstructions ?? null,
        inventory,
        has_white_goods: whiteGoods,
        deposit_amount: finalDeposit,
        is_partial_lead: false,
      })
      .eq("id", bookingId);
  } catch (e) {
    console.warn("lead completion logistics update skipped:", e);
  }

  // 7. Detail + add-on rows (delete-then-insert so a repeat completion is clean).
  await supabase.from("removals_details").delete().eq("booking_id", bookingId);
  await supabase.from("removals_details").insert({
    booking_id: bookingId,
    removal_type: data.removalType,
    property_type: data.propertyType,
    bedrooms: data.bedrooms,
  });

  await supabase.from("additional_services").delete().eq("booking_id", bookingId);
  await supabase.from("additional_services").insert({
    booking_id: bookingId,
    ...data.additionalServices,
  });
  // Add-on quantities (best-effort — new columns).
  try {
    await supabase
      .from("additional_services")
      .update({
        packing_hours: data.packingHours ?? 0,
        packing_men: data.packingMen ?? 1,
        dismantle_count: data.dismantleCount ?? 0,
        assemble_count: data.assembleCount ?? 0,
      })
      .eq("booking_id", bookingId);
  } catch (e) {
    console.warn("lead completion add-on quantities skipped:", e);
  }

  // 8. Activity log.
  await supabase.from("activity_log").insert({
    booking_id: bookingId,
    customer_id: customerId,
    action: "lead_completed",
    metadata: { reference: booking.reference, quote_total: finalTotal, manual_price: useOverride },
    performed_by: useOverride ? "admin" : "customer",
  });

  // 9. The quote is now ready → advance to "Quote Sent to Customer".
  await markQuoteSent(supabase, bookingId, (booking.status as string) ?? null);

  return { reference: booking.reference as string, bookingId, customerId, quoteTotal: finalTotal };
}
