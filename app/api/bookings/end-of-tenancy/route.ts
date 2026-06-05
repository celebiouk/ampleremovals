import { NextResponse } from "next/server";

/**
 * POST /api/bookings/end-of-tenancy
 * Phase 1 scaffold — implemented in Phase 2.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Not implemented yet. End of Tenancy booking API arrives in Phase 2.",
    },
    { status: 501 }
  );
}
