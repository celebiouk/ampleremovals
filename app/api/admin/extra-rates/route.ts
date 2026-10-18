/**
 * GET /api/admin/extra-rates — same 4 rates as /api/drivers/extra-rates, but
 * admin-gated, for the admin web/native "Add extra charge" UI (admin can add
 * one directly, not just approve a driver-submitted one).
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdmin();
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
