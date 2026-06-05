import { NextResponse } from "next/server";

/**
 * POST /api/bookings/house-cleaning
 * Phase 1 scaffold — implemented in Phase 2.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Not implemented yet. House Cleaning booking API arrives in Phase 2.",
    },
    { status: 501 }
  );
}
