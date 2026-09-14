/**
 * POST /api/admin/anyvan-jobs — create a minimal job for work handled through
 * AnyVan (never touches this system as a real booking): just a date/time,
 * no customer/addresses/invoice. Reuses `bookings` (is_anyvan: true,
 * status: 'anyvan_job') so the existing assign/accept-decline/driver-app
 * machinery works unchanged — see lib/daily-pay.ts and the plan notes in
 * supabase/migrations/add_anyvan_jobs.sql for why.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";

const ANYVAN_CUSTOMER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as { date?: string; time?: string } | null;
  if (!body?.date) return NextResponse.json({ success: false, error: "Date required" }, { status: 400 });

  const supabase = createAdminClient();
  const reference = generateBookingReference("man_and_van");

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: "man_and_van",
      customer_id: ANYVAN_CUSTOMER_ID,
      status: "anyvan_job",
      is_anyvan: true,
      move_date: body.date,
      move_time: body.time ?? null,
      source: "anyvan",
    })
    .select("id, reference")
    .single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    action: `AnyVan job created for ${body.date}`,
    performed_by: "admin",
  });

  return NextResponse.json({ success: true, booking });
}
