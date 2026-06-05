import { NextResponse } from "next/server";

/**
 * POST /api/bookings/removals
 * Phase 1 scaffold — the booking-creation pipeline (validation, customer +
 * address + booking inserts, notifications) is implemented in Phase 2.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented yet. Removals booking API arrives in Phase 2." },
    { status: 501 }
  );
}
