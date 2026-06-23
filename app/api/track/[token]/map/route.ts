/**
 * GET /api/track/[token]/map — PUBLIC. Renders a clean Static Maps image for the
 * customer tracking page: a purple "D" pin at the driver, a green "B" pin at the
 * destination, and a line between them. The Google key stays server-side (the
 * image bytes are streamed back). Falls back to a 502 so the page can show the
 * keyless embed instead. Requires the "Maps Static API" to be enabled on the key.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return new NextResponse(null, { status: 404 });

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, current_journey_leg, " +
        "origin:addresses!origin_address_id(lat, lng), " +
        "destination:addresses!destination_address_id(lat, lng)"
    )
    .eq("live_tracking_token", params.token)
    .maybeSingle();
  if (!booking) return new NextResponse(null, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = booking as any;
  const dest = b.current_journey_leg === "delivery" ? b.destination : b.origin;

  const { data: assignment } = await supabase
    .from("booking_driver_assignments")
    .select("driver:drivers(id)")
    .eq("booking_id", b.id)
    .limit(1)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverId = (assignment as any)?.driver?.id;

  let loc: { lat: number; lng: number } | null = null;
  if (driverId) {
    const { data } = await supabase
      .from("driver_locations")
      .select("lat, lng")
      .eq("driver_id", driverId)
      .maybeSingle();
    if (data?.lat != null && data?.lng != null) loc = { lat: Number(data.lat), lng: Number(data.lng) };
  }

  const parts: string[] = ["size=640x360", "scale=2", "maptype=roadmap"];
  if (loc) parts.push(`markers=${encodeURIComponent(`color:0x6b21a8|label:D|${loc.lat},${loc.lng}`)}`);
  if (dest?.lat != null) parts.push(`markers=${encodeURIComponent(`color:0x16a34a|label:B|${dest.lat},${dest.lng}`)}`);
  if (loc && dest?.lat != null) parts.push(`path=${encodeURIComponent(`color:0x6b21a8cc|weight:4|${loc.lat},${loc.lng}|${dest.lat},${dest.lng}`)}`);
  if (!loc && dest?.lat == null) return new NextResponse(null, { status: 404 });

  const url = `https://maps.googleapis.com/maps/api/staticmap?${parts.join("&")}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return new NextResponse(null, { status: 502 });
  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    headers: { "Content-Type": res.headers.get("content-type") || "image/png", "Cache-Control": "no-store" },
  });
}
