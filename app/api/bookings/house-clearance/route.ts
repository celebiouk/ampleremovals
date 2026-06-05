import { NextResponse } from "next/server";

/**
 * POST /api/bookings/house-clearance
 * Phase 1 scaffold — implemented in Phase 2.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Not implemented yet. House Clearance booking API arrives in Phase 2.",
    },
    { status: 501 }
  );
}
