import { NextRequest, NextResponse } from "next/server";
import { drivingLeg, type DrivingLeg } from "@/lib/google-maps";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The office postcode is editable in Settings — never serve a cached distance.
export const fetchCache = "force-no-store";

const FALLBACK_OFFICE = "RG18 3EB";

/**
 * POST /api/postcode/distances
 * Returns the three DRIVING legs the team cares about for a job, each with
 * distance (miles) AND duration (minutes) — real road routing via Google
 * Distance Matrix (the same source the driver ETA uses; not straight-line):
 *  - officeToOrigin      : our office (from Settings) → the first pickup
 *  - originToDestination : pickup → dropoff (null if there's no destination)
 *  - destinationToOffice : dropoff → back to our office (null if there's no
 *                          destination; falls back from the origin if there's
 *                          no dropoff, so a one-address job still shows a
 *                          return leg)
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

  // The "return to office" leg starts from the dropoff if there is one,
  // otherwise from the pickup (a job with only one address still ends there).
  const returnFrom = destination || origin;

  const [officeToOrigin, originToDestination, returnToOffice] = await Promise.all([
    origin ? drivingLeg(office, origin) : Promise.resolve(null),
    origin && destination ? drivingLeg(origin, destination) : Promise.resolve(null),
    returnFrom ? drivingLeg(returnFrom, office) : Promise.resolve(null),
  ]);

  const leg = (l: DrivingLeg | null) => (l ? { miles: l.miles, minutes: l.minutes } : null);

  return NextResponse.json({
    success: true,
    officePostcode: office,
    officeToOrigin: leg(officeToOrigin),
    originToDestination: leg(originToDestination),
    destinationToOffice: leg(returnToOffice),
  });
}
