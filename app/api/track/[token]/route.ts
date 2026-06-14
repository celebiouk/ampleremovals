/**
 * GET /api/track/[token] — PUBLIC (no auth). The live-tracking link the customer
 * receives resolves a booking by its live_tracking_token and returns just enough
 * to render the map: current journey leg, destination, ETA, and the driver's last
 * known position. No PII beyond the driver's first name.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const supabase = createAdminClient();
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        "id, reference, status, current_journey_leg, arrived_at, completed_at, " +
          "call1_eta_timestamp, call2_eta_timestamp, call3_eta_timestamp, " +
          "origin:addresses!origin_address_id(line_1, city, postcode, lat, lng), " +
          "destination:addresses!destination_address_id(line_1, city, postcode, lat, lng)"
      )
      .eq("live_tracking_token", params.token)
      .maybeSingle();

    if (!booking) {
      return NextResponse.json({ success: false, error: "Tracking link not found" }, { status: 404 });
    }

    // Resolve which driver is on this job, then their latest position.
    const { data: assignment } = await supabase
      .from("booking_driver_assignments")
      .select("driver:drivers(id, first_name, preferred_name)")
      .eq("booking_id", booking.id)
      .limit(1)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const driver = (assignment as any)?.driver;

    let location: { lat: number; lng: number; heading: number | null; recorded_at: string } | null = null;
    if (driver?.id) {
      const { data: loc } = await supabase
        .from("driver_locations")
        .select("lat, lng, heading, recorded_at")
        .eq("driver_id", driver.id)
        .maybeSingle();
      if (loc) location = loc;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leg = (booking as any).current_journey_leg as "pickup" | "delivery" | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = booking as any;
    const destination = leg === "delivery" ? b.destination : b.origin;
    const eta = b.call3_eta_timestamp || b.call2_eta_timestamp || b.call1_eta_timestamp || null;

    return NextResponse.json({
      success: true,
      reference: b.reference,
      status: b.status,
      leg,
      arrived: !!b.arrived_at,
      completed: !!b.completed_at,
      eta,
      driverName: driver?.preferred_name || driver?.first_name || "Your driver",
      destination: destination
        ? { line_1: destination.line_1, city: destination.city, postcode: destination.postcode, lat: destination.lat, lng: destination.lng }
        : null,
      location,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
