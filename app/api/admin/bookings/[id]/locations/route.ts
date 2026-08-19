/**
 * Booking locations — multiple pickup / drop-off addresses (up to 2 each), each
 * with its own property details. Admin-managed.
 *
 * GET  /api/admin/bookings/[id]/locations       → all locations for the booking
 * PUT  /api/admin/bookings/[id]/locations       → replace the whole set
 *
 * On PUT we also keep the legacy origin/destination address + booking-level
 * property fields in sync from the PRIMARY (sequence 1) pickup/drop-off so the
 * rest of the system (distance, quotes, PDFs) stays consistent.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const LOCATION_COLS =
  "id, role, sequence, line_1, line_2, city, county, postcode, country, lat, lng, " +
  "property_type, floor, has_stairs, num_steps, has_lift, has_parking, narrow_access, access_notes";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("booking_locations")
    .select(LOCATION_COLS)
    .eq("booking_id", params.id)
    .order("role", { ascending: true })
    .order("sequence", { ascending: true });
  return NextResponse.json({ success: true, locations: data ?? [] });
}

const locationSchema = z.object({
  role: z.enum(["pickup", "dropoff"]),
  sequence: z.number().int().min(1).max(2),
  line_1: z.string().trim().max(200).optional().nullable(),
  line_2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  county: z.string().trim().max(120).optional().nullable(),
  postcode: z.string().trim().max(20).optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  property_type: z.enum(["house", "flat", "bungalow", "maisonette", "other"]).optional().nullable(),
  floor: z.string().max(20).optional().nullable(),
  has_stairs: z.boolean().optional().nullable(),
  num_steps: z.number().int().min(0).max(200).optional().nullable(),
  has_lift: z.boolean().optional().nullable(),
  has_parking: z.boolean().optional().nullable(),
  narrow_access: z.boolean().optional().nullable(),
  access_notes: z.string().trim().max(1000).optional().nullable(),
});

const schema = z.object({ locations: z.array(locationSchema).max(4) });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid locations" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const bookingId = params.id;
  const rows = parsed.data.locations.map((l) => ({ ...l, booking_id: bookingId, country: "United Kingdom" }));

  // Replace the whole set for this booking.
  await supabase.from("booking_locations").delete().eq("booking_id", bookingId);
  if (rows.length) {
    const { error } = await supabase.from("booking_locations").insert(rows);
    if (error) return NextResponse.json({ success: false, error: "Couldn't save locations." }, { status: 500 });
  }

  // Keep the legacy primary origin/destination addresses + booking property
  // fields in sync so distance/quotes/PDFs still work.
  const primaryPickup = parsed.data.locations.find((l) => l.role === "pickup" && l.sequence === 1);
  const primaryDrop = parsed.data.locations.find((l) => l.role === "dropoff" && l.sequence === 1);

  async function upsertAddress(loc: typeof primaryPickup): Promise<string | null> {
    if (!loc || !(loc.line_1 || loc.postcode)) return null;
    const { data } = await supabase
      .from("addresses")
      .insert({ line_1: loc.line_1 ?? "", line_2: loc.line_2 ?? null, city: loc.city ?? null, county: loc.county ?? null, postcode: loc.postcode ?? "", country: "United Kingdom", lat: loc.lat ?? null, lng: loc.lng ?? null })
      .select("id")
      .single();
    return data?.id ?? null;
  }

  const bookingUpdate: Record<string, unknown> = {};
  const originId = await upsertAddress(primaryPickup);
  const destId = await upsertAddress(primaryDrop);
  if (originId) bookingUpdate.origin_address_id = originId;
  if (destId) bookingUpdate.destination_address_id = destId;
  if (primaryPickup) {
    if (primaryPickup.floor != null) bookingUpdate.floor = primaryPickup.floor;
    if (primaryPickup.has_lift != null) bookingUpdate.has_lift = primaryPickup.has_lift;
    if (primaryPickup.has_parking != null) bookingUpdate.parking_within_20m = primaryPickup.has_parking;
  }
  if (Object.keys(bookingUpdate).length) {
    await supabase.from("bookings").update(bookingUpdate).eq("id", bookingId);
  }

  await supabase.from("activity_log").insert({
    booking_id: bookingId,
    action: `Locations updated by admin — ${parsed.data.locations.filter((l) => l.role === "pickup").length} pickup, ${parsed.data.locations.filter((l) => l.role === "dropoff").length} drop-off`,
    performed_by: auth.userId ?? "admin",
  });

  const { data } = await supabase.from("booking_locations").select(LOCATION_COLS).eq("booking_id", bookingId).order("role").order("sequence");
  return NextResponse.json({ success: true, locations: data ?? [] });
}
