/**
 * POST /api/admin/job-pay-requests/[id]/approve — admin sets an amount for a
 * driver/porter's retroactive pay request. Creates a minimal AnyVan-style
 * booking + assignment + driver_earnings row (reusing the exact same
 * pipeline flat-pay assignments use — see lib/driver-earnings.ts, this route
 * mirrors assign-driver's earnings-insert shape) rather than loosening
 * driver_earnings' NOT NULL booking_id/assignment_id.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBookingReference } from "@/lib/utils";

const ANYVAN_CUSTOMER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as { amount?: number } | null;
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ success: false, error: "Enter a valid amount" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: request } = await supabase
    .from("job_pay_requests")
    .select("id, driver_id, work_date, description, status, drivers(account_type)")
    .eq("id", params.id)
    .maybeSingle();
  if (!request) return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
  if (request.status !== "pending") return NextResponse.json({ success: false, error: "Already decided" }, { status: 400 });

  const driverInfo = Array.isArray(request.drivers) ? request.drivers[0] : request.drivers;
  const role = driverInfo?.account_type === "porter" ? "porter" : "driver";

  const reference = generateBookingReference("man_and_van");
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      reference,
      service_type: "man_and_van",
      customer_id: ANYVAN_CUSTOMER_ID,
      status: "anyvan_job",
      is_anyvan: true,
      move_date: request.work_date,
      description: request.description,
      source: "manual_pay_request",
    })
    .select("id")
    .single();
  if (bookingError) return NextResponse.json({ success: false, error: bookingError.message }, { status: 500 });

  const { data: assignment, error: assignError } = await supabase
    .from("booking_driver_assignments")
    .insert({ booking_id: booking.id, driver_id: request.driver_id, role, flat_pay_amount: amount })
    .select("id")
    .single();
  if (assignError) return NextResponse.json({ success: false, error: assignError.message }, { status: 500 });

  await supabase.from("driver_earnings").insert({
    driver_id: request.driver_id,
    booking_id: booking.id,
    assignment_id: assignment.id,
    booking_total: 0,
    pay_percentage: 0,
    gross_earnings: amount,
    tip_amount: 0,
    total_earnings: amount,
    status: "pending",
  });

  await supabase
    .from("job_pay_requests")
    .update({ status: "approved", approved_amount: amount, approved_booking_id: booking.id, decided_by: "admin", decided_at: new Date().toISOString() })
    .eq("id", params.id);

  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    action: `Manual pay request approved: £${amount.toFixed(2)}`,
    metadata: { job_pay_request_id: params.id, driver_id: request.driver_id },
    performed_by: "admin",
  });

  return NextResponse.json({ success: true, bookingId: booking.id });
}
