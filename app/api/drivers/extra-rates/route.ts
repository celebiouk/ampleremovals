/**
 * GET /api/drivers/extra-rates — the admin-set £ rates the driver app uses to
 * auto-price an on-site extra (item / stairs / distance) before the driver
 * submits it. Kept in `settings` so admin can tune them without a code change.
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("settings")
    .select("extra_item_rate, extra_stairs_rate_per_flight, extra_distance_free_meters, extra_distance_rate_per_10m")
    .eq("id", 1)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    rates: {
      itemRate: Number(data?.extra_item_rate ?? 15),
      stairsRatePerFlight: Number(data?.extra_stairs_rate_per_flight ?? 10),
      distanceFreeMeters: Number(data?.extra_distance_free_meters ?? 20),
      distanceRatePer10m: Number(data?.extra_distance_rate_per_10m ?? 5),
    },
  });
}
