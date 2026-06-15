/**
 * POST /api/admin/addresses/geocode-missing — one-off backfill.
 *
 * Geocodes every address that has no lat/lng yet (via postcodes.io) so existing
 * bookings work with the driver app's map + arrival detection. Safe to re-run.
 */

import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { geocodePostcode } from "@/lib/postcode";

export async function POST() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("addresses")
    .select("id, postcode")
    .is("lat", null)
    .not("postcode", "is", null)
    .limit(1000);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  let updated = 0;
  let failed = 0;
  for (const row of rows ?? []) {
    const coords = await geocodePostcode(row.postcode as string);
    if (!coords) { failed++; continue; }
    const { error: upErr } = await supabase
      .from("addresses")
      .update({ lat: coords.lat, lng: coords.lng })
      .eq("id", row.id);
    if (upErr) failed++; else updated++;
  }

  return NextResponse.json({ success: true, scanned: rows?.length ?? 0, updated, failed });
}
