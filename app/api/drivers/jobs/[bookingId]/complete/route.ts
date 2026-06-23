/**
 * POST /api/drivers/jobs/[bookingId]/complete — driver taps COMPLETE JOB.
 * Sets completed_at + booking status job_completed (which feeds the existing
 * completion flow: invoice + 30-min review request automation), writes history,
 * and notifies admin.
 */

import { NextResponse } from "next/server";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAdminPush } from "@/lib/push-dispatch";
import { sendReviewRequest } from "@/lib/review-request";

export async function POST(_req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }

    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, delivery_confirmed, status")
      .eq("id", params.bookingId)
      .single();
    if (!booking?.delivery_confirmed) {
      return NextResponse.json({ success: false, error: "Confirm delivery first" }, { status: 400 });
    }

    const now = new Date().toISOString();
    await supabase.from("bookings").update({
      completed_at: now,
      status: "job_completed",
      latest_driver_status: "job_completed",
      current_journey_leg: null,
    }).eq("id", params.bookingId);

    // Feed the existing completion pipeline (notifications + automations).
    await supabase.from("driver_job_status_updates").insert({
      booking_id: params.bookingId, driver_id: auth.driver.id, status: "job_completed",
    });
    await supabase.from("status_history").insert({
      booking_id: params.bookingId, status: "job_completed",
      changed_by: `Driver: ${auth.driver.preferred_name || auth.driver.first_name}`,
    });
    await supabase.from("activity_log").insert({
      booking_id: params.bookingId,
      action: `Job ${booking.reference} completed — invoice triggered`,
      metadata: { driver_id: auth.driver.id }, performed_by: "driver",
    });
    await supabase.from("notifications").insert({
      title: "Job completed", description: `Job ${booking.reference} completed. Invoice triggered.`,
      booking_id: params.bookingId, is_read: false,
    });
    try { await sendAdminPush({ title: "Job completed", body: `${booking.reference} completed — invoice triggered`, data: { bookingId: params.bookingId } }); } catch { /* best-effort */ }

    // Thank the customer + ask for a Google review (best-effort, idempotent).
    await sendReviewRequest(supabase, params.bookingId);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
