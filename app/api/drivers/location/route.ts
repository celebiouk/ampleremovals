/**
 * POST /api/drivers/location — upsert the driver's latest GPS (called every 60s,
 * incl. from background). Used by the ETA cron + the live tracking page. Supports
 * a `batch` array for offline bulk-sync (only the latest is kept as current).
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    // Accept a single point or a batch (offline sync). Keep the most recent.
    const points: Array<{ lat: number; lng: number; heading?: number; speed?: number; accuracy?: number; recorded_at?: string }> =
      Array.isArray(body?.batch) ? body.batch : [body];
    const latest = points
      .filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number")
      .sort((a, b) => new Date(a.recorded_at ?? 0).getTime() - new Date(b.recorded_at ?? 0).getTime())
      .pop();
    if (!latest) return NextResponse.json({ success: false, error: "No valid point" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from("driver_locations").upsert(
      {
        driver_id: auth.driver.id,
        lat: latest.lat,
        lng: latest.lng,
        heading: latest.heading ?? null,
        speed: latest.speed ?? null,
        accuracy: latest.accuracy ?? null,
        recorded_at: latest.recorded_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "driver_id" }
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
