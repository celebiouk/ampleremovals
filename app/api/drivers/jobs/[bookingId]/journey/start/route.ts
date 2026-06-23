/**
 * POST /api/drivers/jobs/[bookingId]/journey/start — Call 1 of the ETA engine.
 * Body: { leg: 'pickup'|'delivery', lat, lng }. Runs the Distance Matrix call
 * server-side (instant ETA), fires journey-started notifications, schedules Call 2,
 * and ensures a live-tracking token exists. Returns the ETA for the app to show.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { startJourneyCall1 } from "@/lib/driver-eta";
import { geocodePostcode } from "@/lib/postcode";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;

  try {
    const { leg, lat, lng } = await req.json();
    if (leg !== "pickup" && leg !== "delivery") {
      return NextResponse.json({ success: false, error: "leg must be pickup|delivery" }, { status: 400 });
    }
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ success: false, error: "lat/lng required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }

    // Ensure a tracking token (so the notification links work).
    const { data: b } = await supabase.from("bookings").select("live_tracking_token").eq("id", params.bookingId).single();
    if (!b?.live_tracking_token) {
      await supabase.from("bookings").update({ live_tracking_token: randomUUID().replace(/-/g, "") }).eq("id", params.bookingId);
    }
    // Seed the driver's GPS so the cron has it immediately.
    await supabase.from("driver_locations").upsert(
      { driver_id: auth.driver.id, lat, lng, recorded_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "driver_id" }
    );

    // Ensure the destination has real coordinates BEFORE the app arms its 80m
    // arrival check — otherwise it would fall back to the driver's own position
    // and fire "arrived" instantly. Geocode + persist if missing. Return the
    // coords so the app uses these (not its possibly-stale job data).
    const addrCol = leg === "pickup" ? "origin_address_id" : "destination_address_id";
    let destLat: number | null = null;
    let destLng: number | null = null;
    const { data: bk } = await supabase
      .from("bookings")
      .select(`addr:addresses!${addrCol}(id, lat, lng, postcode)`)
      .eq("id", params.bookingId)
      .single();
    const addr = Array.isArray(bk?.addr) ? bk?.addr[0] : bk?.addr;
    if (addr) {
      destLat = addr.lat != null ? Number(addr.lat) : null;
      destLng = addr.lng != null ? Number(addr.lng) : null;
      if ((destLat == null || destLng == null) && addr.postcode) {
        const geo = await geocodePostcode(addr.postcode);
        if (geo) {
          destLat = geo.lat;
          destLng = geo.lng;
          await supabase.from("addresses").update({ lat: geo.lat, lng: geo.lng }).eq("id", addr.id);
        }
      }
    }

    const result = await startJourneyCall1(supabase, params.bookingId, leg, auth.driver, lat, lng);
    return NextResponse.json({ success: true, ...result, destLat, destLng });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
