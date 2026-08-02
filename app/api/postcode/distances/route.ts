import { NextRequest, NextResponse } from "next/server";
import { calculateDistance } from "@/lib/postcode";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The office postcode is editable in Settings — never serve a cached distance.
export const fetchCache = "force-no-store";

const FALLBACK_OFFICE = "RG18 3EB";

/**
 * POST /api/postcode/distances
 * Returns the two distances the team cares about for a job, in miles:
 *  - officeToOrigin      : our office (from Settings) → the first pickup
 *  - originToDestination : pickup → dropoff (null if there's no destination)
 * The office postcode is read from settings so it's never hardcoded.
 */
export async function POST(req: NextRequest) {
  let body: { origin?: string; destination?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }
  const origin = (body.origin ?? "").trim();
  const destination = (body.destination ?? "").trim();

  // Office postcode comes from Settings (editable), falling back to the default.
  let office = FALLBACK_OFFICE;
  try {
    const { data } = await createAdminClient()
      .from("settings")
      .select("office_postcode")
      .eq("id", 1)
      .single();
    if (data?.office_postcode && String(data.office_postcode).trim()) {
      office = String(data.office_postcode).trim();
    }
  } catch {
    /* fall back to default office postcode */
  }

  const [officeToOrigin, originToDestination] = await Promise.all([
    origin ? calculateDistance(office, origin) : Promise.resolve(null),
    origin && destination ? calculateDistance(origin, destination) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    success: true,
    officePostcode: office,
    officeToOrigin,
    originToDestination,
  });
}
