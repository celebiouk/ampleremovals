import { createServiceClient } from "@/lib/supabase/server";
import { insertAddress } from "@/lib/bookings/createBooking";
import { markQuoteSent } from "@/lib/bookings/quoteDelivery";
import { buildQuote } from "@/lib/quote-engine";
import { loadPricing, priceInventory, mileageCost, milesBetweenPostcodes } from "@/lib/pricing";
import { depositFor } from "@/lib/deposit";
import { hasWhiteGoods } from "@/lib/inventory-catalog";
import { ukDateString } from "@/lib/dates";
import type { RemovalsForm } from "@/lib/schemas/booking";

const toDateString = (d?: Date | null): string | null => (d ? ukDateString(d) : null);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Optional overrides applied when an admin (not the customer) completes a lead. */
export interface CompleteLeadOptions {
  /**
   * Prices the admin typed in themselves (they're on a call agreeing it). Either
   * or both can be set — whatever the admin fills in becomes exactly what the
   * CUSTOMER sees and is charged for that package on their quote page, replacing
   * the auto-estimate for that tier. The customer still picks Standard or
   * Premium themselves as normal; this only fixes the prices, not the choice.
   * Leaving one (or both) blank falls back to the auto-estimate for it.
   */
  standardPriceOverride?: number;
  premiumPriceOverride?: number;
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

  // 5. Inventory + quote (item-based pricing: call-out + your items + distance).
  const inventory = Array.isArray(data.inventory) ? data.inventory : [];
  const whiteGoods = hasWhiteGoods(inventory);
  const { config: pricingCfg, items: itemPrices } = await loadPricing(supabase);
  const itemsSubtotal = priceInventory(inventory, itemPrices);
  const miles = await milesBetweenPostcodes(data.originAddress?.postcode, data.destinationAddress?.postcode);
  const mCost = mileageCost(miles, pricingCfg);
  const quote = buildQuote({
    bedrooms: data.bedrooms,
    packingHours: data.packingHours ?? 0,
    packingMen: data.packingMen ?? 1,
    dismantleCount: data.dismantleCount ?? 0,
    assembleCount: data.assembleCount ?? 0,
    eotCleaning: Boolean(data.wantsEotCleaning),
    baseCallout: pricingCfg.base_callout,
    itemsSubtotal,
    itemCount: inventory.reduce((n: number, i: { quantity?: number }) => n + (Number(i?.quantity) || 0), 0),
    mileageMiles: miles,
    mileageCost: mCost,
  });

  // Manual prices (admin on a call) win over the auto-estimate, independently for
  // each tier. The customer still picks Standard or Premium themselves — this
  // only fixes what each one costs. quote_total/quote_line_items always represent
  // STANDARD; Premium is its own column (quote_premium_total), read directly by
  // the customer quote page and the reserve step instead of being recomputed as
  // Standard × multiplier, so an overridden Premium price is never overwritten.
  const stdOverride = opts?.standardPriceOverride;
  const useStdOverride = typeof stdOverride === "number" && Number.isFinite(stdOverride) && stdOverride > 0;
  const finalStandardTotal = useStdOverride ? round2(stdOverride) : quote.total;
  const finalLines = useStdOverride
    ? [{ key: "base", description: "Removals service", quantity: 1, unit_price: finalStandardTotal, total: finalStandardTotal, removable: false }]
    : quote.lines;

  const premOverride = opts?.premiumPriceOverride;
  const usePremOverride = typeof premOverride === "number" && Number.isFinite(premOverride) && premOverride > 0;
  const finalPremiumTotal = usePremOverride ? round2(premOverride) : round2(finalStandardTotal * pricingCfg.premium_multiplier);

  const finalDeposit = depositFor(finalStandardTotal);

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
      quote_subtotal: finalStandardTotal,
      quote_total: finalStandardTotal,
      quote_premium_total: finalPremiumTotal,
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
        has_lift: data.hasLift ?? false, // "no lift" unless the customer says yes
        parking_within_20m: data.parkingWithin20m ?? null,
        special_instructions: data.specialInstructions ?? null,
        dest_floor: data.destFloor ?? null,
        dest_has_lift: data.destHasLift ?? false, // "no lift" unless the customer says yes
        dest_parking_within_20m: data.destParkingWithin20m ?? null,
        dest_access_notes: data.destAccessNotes ?? null,
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
  // Premium's done-for-you services (packing/materials/dismantle/assemble) are
  // bundled in when the CUSTOMER actually picks Premium at reserve time (see
  // /api/quote/reserve) — not pre-decided here, since admin no longer chooses
  // the tier on their behalf.
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
    metadata: {
      reference: booking.reference,
      standard_total: finalStandardTotal,
      premium_total: finalPremiumTotal,
      manual_standard_price: useStdOverride,
      manual_premium_price: usePremOverride,
    },
    performed_by: useStdOverride || usePremOverride ? "admin" : "customer",
  });

  // 9. The quote is now ready → advance to "Quote Sent to Customer".
  await markQuoteSent(supabase, bookingId, (booking.status as string) ?? null);

  return { reference: booking.reference as string, bookingId, customerId, quoteTotal: finalStandardTotal };
}
