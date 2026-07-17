import { createServiceClient } from "@/lib/supabase/server";
import { insertAddress } from "@/lib/bookings/createBooking";
import { buildQuote } from "@/lib/quote-engine";
import { hasWhiteGoods } from "@/lib/inventory-catalog";
import { ukDateString } from "@/lib/dates";
import type { RemovalsForm } from "@/lib/schemas/booking";

const toDateString = (d?: Date | null): string | null => (d ? ukDateString(d) : null);

export interface CompleteLeadResult {
  reference: string;
  bookingId: string;
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
  data: RemovalsForm
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
    dismantleCount: data.dismantleCount ?? 0,
    assembleCount: data.assembleCount ?? 0,
    eotCleaning: Boolean(data.wantsEotCleaning),
  });

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
      quote_line_items: quote.lines,
      quote_subtotal: quote.total,
      quote_total: quote.total,
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
        deposit_amount: quote.depositAmount,
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
    metadata: { reference: booking.reference, quote_total: quote.total },
    performed_by: "customer",
  });

  return { reference: booking.reference as string, bookingId };
}
