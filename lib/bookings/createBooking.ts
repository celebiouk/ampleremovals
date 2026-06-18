import { createServiceClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";
import { geocodePostcode } from "@/lib/postcode";
import { deriveSource, type Attribution } from "@/lib/attribution";
import { computeLeadScore } from "@/lib/lead-scoring";
import type { ServiceType, AddressOption } from "@/types";
import type {
  RemovalsForm,
  ManAndVanForm,
  HouseClearanceForm,
  HouseCleaningForm,
  EndOfTenancyForm,
  AnyBookingForm,
} from "@/lib/schemas/booking";

const toDateString = (d?: Date | null): string | null =>
  d ? new Date(d).toISOString().slice(0, 10) : null;

async function insertAddress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  address: AddressOption
): Promise<string> {
  // Geocode the postcode so the driver app gets map pins + 80m arrival
  // detection. Best-effort: a failed lookup just leaves coords null.
  const coords = await geocodePostcode(address.postcode);

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      line_1: address.line_1,
      line_2: address.line_2 ?? null,
      city: address.city ?? null,
      postcode: address.postcode,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`address insert failed: ${error.message}`);
  return data.id as string;
}

export interface BookingResult {
  reference: string;
  bookingId: string;
  customerId: string;
}

/**
 * Persists a validated booking: customer (upsert), address(es), booking,
 * service-specific detail row, additional services, status history and
 * activity log. Returns { reference, bookingId, customerId }.
 */
export async function createBooking(
  serviceType: ServiceType,
  data: AnyBookingForm,
  attribution?: Attribution | null
): Promise<BookingResult> {
  const supabase = createServiceClient();

  // 1. Customer (upsert by unique email).
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .upsert(
      { full_name: data.fullName, email: data.email, phone: data.phone },
      { onConflict: "email" }
    )
    .select("id")
    .single();
  if (customerError || !customer)
    throw new Error(`customer upsert failed: ${customerError?.message}`);
  const customerId = customer.id as string;

  // 2. Addresses.
  const originAddressId = await insertAddress(supabase, data.originAddress);
  let destinationAddressId: string | null = null;
  if ("destinationAddress" in data && data.destinationAddress) {
    destinationAddressId = await insertAddress(supabase, data.destinationAddress);
  }

  // 3. Date handling (differs per service).
  const reference = generateBookingReference(serviceType);
  let moveDate: string | null = null;
  let isFlexible = false;
  let flexFrom: string | null = null;
  let flexTo: string | null = null;

  if (serviceType === "house_cleaning") {
    moveDate = toDateString((data as HouseCleaningForm).moveDate);
  } else if (serviceType === "end_of_tenancy") {
    moveDate = toDateString((data as EndOfTenancyForm).tenancyEndDate);
  } else {
    const d = data as RemovalsForm | ManAndVanForm | HouseClearanceForm;
    isFlexible = Boolean(d.isFlexibleDate);
    if (isFlexible) {
      flexFrom = toDateString(d.flexibleDateFrom);
      flexTo = toDateString(d.flexibleDateTo);
    } else {
      moveDate = toDateString(d.moveDate);
    }
  }

  const description =
    "description" in data ? (data.description as string) : null;

  // 3b. Lead score (deterministic). Returning customer = has prior bookings.
  const derivedSource = attribution ? deriveSource(attribution) : "website";
  const { count: priorBookings } = await supabase
    .from("bookings").select("*", { count: "exact", head: true }).eq("customer_id", customerId);
  const bedrooms = "bedrooms" in data ? ((data as { bedrooms?: string }).bedrooms ?? null) : null;
  const destinationRequired = serviceType === "removals" || serviceType === "man_and_van";
  const lead = computeLeadScore({
    moveDate: moveDate ?? flexFrom,
    hasEmail: Boolean(data.email),
    hasPhone: Boolean(data.phone),
    hasOrigin: true,
    hasDestination: Boolean(destinationAddressId),
    destinationRequired,
    bedrooms,
    serviceType,
    source: derivedSource,
    returningCustomer: (priorBookings ?? 0) > 0,
  });

  // 4. Booking row — only the core columns that have always existed, so a
  // booking can never fail because an optional analytics column/migration is
  // missing. (`source` has always existed; default it here.)
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: serviceType,
      customer_id: customerId,
      origin_address_id: originAddressId,
      destination_address_id: destinationAddressId,
      status: "inquiry",
      move_date: moveDate,
      is_flexible_date: isFlexible,
      flexible_date_from: flexFrom,
      flexible_date_to: flexTo,
      description,
      source: derivedSource,
    })
    .select("id")
    .single();
  if (bookingError || !booking)
    throw new Error(`booking insert failed: ${bookingError?.message}`);
  const bookingId = booking.id as string;

  // 4b. Lead score + marketing attribution — best-effort, so the booking still
  // succeeds if these columns/migrations aren't present yet.
  try {
    const { error: metaErr } = await supabase
      .from("bookings")
      .update({
        heard_about_us: (data as { heardAbout?: string }).heardAbout || null,
        lead_score: lead.score,
        lead_band: lead.band,
        utm_source: attribution?.utm_source ?? null,
        utm_medium: attribution?.utm_medium ?? null,
        utm_campaign: attribution?.utm_campaign ?? null,
        utm_term: attribution?.utm_term ?? null,
        utm_content: attribution?.utm_content ?? null,
        gclid: attribution?.gclid ?? null,
        fbclid: attribution?.fbclid ?? null,
        referrer: attribution?.referrer ?? null,
        landing_page: attribution?.landing_page ?? null,
      })
      .eq("id", bookingId);
    if (metaErr) console.warn("booking attribution/lead update skipped:", metaErr.message);
  } catch (e) {
    console.warn("booking attribution/lead update skipped:", e);
  }

  // 5. Service-specific detail + additional services.
  if (serviceType === "removals") {
    const d = data as RemovalsForm;
    await supabase.from("removals_details").insert({
      booking_id: bookingId,
      removal_type: d.removalType,
      property_type: d.propertyType,
      bedrooms: d.bedrooms,
    });
    await supabase
      .from("additional_services")
      .insert({ booking_id: bookingId, ...d.additionalServices });
  } else if (serviceType === "man_and_van") {
    const d = data as ManAndVanForm;
    await supabase
      .from("man_and_van_details")
      .insert({ booking_id: bookingId, van_type: d.vanType });
    await supabase
      .from("additional_services")
      .insert({ booking_id: bookingId, ...d.additionalServices });
  } else if (serviceType === "house_clearance") {
    const d = data as HouseClearanceForm;
    await supabase.from("house_clearance_details").insert({
      booking_id: bookingId,
      clearance_type: d.clearanceType,
      property_type: d.propertyType,
      bedrooms: d.bedrooms,
      items_of_note: d.itemsOfNote ?? [],
    });
  } else if (serviceType === "house_cleaning") {
    const d = data as HouseCleaningForm;
    await supabase.from("house_cleaning_details").insert({
      booking_id: bookingId,
      cleaning_type: d.cleaningType,
      frequency: d.frequency,
      property_type: d.propertyType,
      bedrooms: d.bedrooms,
      preferred_time_slot: d.timeSlot,
      access_instructions: d.accessInstructions ?? null,
    });
  } else if (serviceType === "end_of_tenancy") {
    const d = data as EndOfTenancyForm;
    await supabase.from("end_of_tenancy_details").insert({
      booking_id: bookingId,
      property_type: d.propertyType,
      bedrooms: d.bedrooms,
      tenancy_end_date: toDateString(d.tenancyEndDate),
      access_instructions: d.accessInstructions ?? null,
      addons: d.addons ?? [],
    });
  }

  // 6. Status history + activity log (best-effort).
  await supabase.from("status_history").insert({
    booking_id: bookingId,
    previous_status: null,
    new_status: "inquiry",
    changed_by: "system",
  });
  await supabase.from("activity_log").insert({
    booking_id: bookingId,
    customer_id: customerId,
    action: "booking_created",
    metadata: { reference, service_type: serviceType, source: "website" },
    performed_by: "website",
  });

  return { reference, bookingId, customerId };
}
