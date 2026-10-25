/**
 * POST /api/admin/anyvan-jobs — create a job for work handled through AnyVan.
 * Reuses `bookings` (is_anyvan: true, status: 'anyvan_job') so the existing
 * assign/accept-decline/driver-app machinery works unchanged — see
 * lib/daily-pay.ts and the plan notes in supabase/migrations/add_anyvan_jobs.sql.
 *
 * Date/time is the only hard requirement — customer contact and addresses are
 * optional at creation (same "fast path, fill in detail later via the booking
 * page" shape as before), but providing them here saves a second trip: a real
 * customer record is created (not the shared placeholder) so the post-job
 * rating request has somewhere real to go, and address(es) get geocoded the
 * same way a normal booking's do (map pins + arrival detection in the driver app).
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";
import { insertAddress } from "@/lib/bookings/createBooking";
import type { AddressOption } from "@/types";

const ANYVAN_CUSTOMER_ID = "00000000-0000-0000-0000-000000000001";

interface AnyvanJobBody {
  date?: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  originAddress?: AddressOption;
  destinationAddress?: AddressOption;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as AnyvanJobBody | null;
  if (!body?.date) return NextResponse.json({ success: false, error: "Date required" }, { status: 400 });

  const hasContact = !!(body.customerName?.trim() || body.customerPhone?.trim());
  if (hasContact && !(body.customerName?.trim() && body.customerPhone?.trim())) {
    return NextResponse.json({ success: false, error: "Customer name and phone are both required if you're adding either" }, { status: 400 });
  }
  if (body.originAddress && !body.originAddress.postcode?.trim()) {
    return NextResponse.json({ success: false, error: "Pickup postcode is required if you're adding a pickup address" }, { status: 400 });
  }
  if (body.destinationAddress && !body.destinationAddress.postcode?.trim()) {
    return NextResponse.json({ success: false, error: "Dropoff postcode is required if you're adding a dropoff address" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const reference = generateBookingReference("man_and_van");

  // Real customer record — not the shared placeholder — so the rating request
  // has an actual person to reach. Email is required by the customers table
  // (NOT NULL + unique); synthesise one when admin didn't have a real one.
  let customerId = ANYVAN_CUSTOMER_ID;
  if (hasContact) {
    const email = body.customerEmail?.trim() || `anyvan+${randomUUID().slice(0, 8)}@internal.ampleremovals.com`;
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert({ full_name: body.customerName!.trim(), email, phone: body.customerPhone!.trim() }, { onConflict: "email" })
      .select("id")
      .single();
    if (customerError || !customer) {
      return NextResponse.json({ success: false, error: `Couldn't save customer: ${customerError?.message}` }, { status: 500 });
    }
    customerId = customer.id as string;
  }

  let originAddressId: string | null = null;
  if (body.originAddress?.postcode?.trim()) {
    try { originAddressId = await insertAddress(supabase, body.originAddress); }
    catch (e) { return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Couldn't save pickup address" }, { status: 500 }); }
  }
  let destinationAddressId: string | null = null;
  if (body.destinationAddress?.postcode?.trim()) {
    try { destinationAddressId = await insertAddress(supabase, body.destinationAddress); }
    catch (e) { return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Couldn't save dropoff address" }, { status: 500 }); }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: "man_and_van",
      customer_id: customerId,
      status: "anyvan_job",
      is_anyvan: true,
      move_date: body.date,
      move_time: body.time ?? null,
      origin_address_id: originAddressId,
      destination_address_id: destinationAddressId,
      source: "anyvan",
    })
    .select("id, reference")
    .single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    action: `AnyVan job created for ${body.date}`,
    performed_by: "admin",
  });

  return NextResponse.json({ success: true, booking });
}
