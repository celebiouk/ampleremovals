/**
 * GET /api/drivers/jobs/[bookingId] — one job for the signed-in driver, REDACTED
 * to what they may see at this lifecycle stage (see lib/driver-job-view). The app
 * uses this instead of reading the booking directly, so PII gating is enforced
 * server-side.
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redactJobForDriver } from "@/lib/driver-job-view";

export async function GET(_req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data: assignment } = await supabase
      .from("booking_driver_assignments")
      .select("acceptance_status, decline_reason")
      .eq("booking_id", params.bookingId)
      .eq("driver_id", auth.driver.id)
      .maybeSingle();
    if (!assignment) return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, customer:customers(*), origin:addresses!origin_address_id(*), destination:addresses!destination_address_id(*)")
      .eq("id", params.bookingId)
      .single();
    if (error || !booking) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const job = {
      ...redactJobForDriver(booking, assignment.acceptance_status),
      decline_reason: assignment.decline_reason ?? null,
    };
    return NextResponse.json({ success: true, job });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
