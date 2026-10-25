/**
 * POST /api/drivers/jobs/[bookingId]/mark-done — the signed-in worker (driver
 * or porter) says their part of this job is done, so it's ready for admin to
 * confirm and release pay. Separate from the lead driver's existing Complete
 * Job flow (delivery_confirmed → job_completed, which is about the CUSTOMER
 * side — invoice + survey) — this is purely the payroll-facing signal, and
 * applies to every assignment with a flat pay amount (driver or porter,
 * AnyVan or a normal booking).
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAdminPush } from "@/lib/push-dispatch";

export async function POST(_req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("booking_driver_assignments")
    .select("id, role, completion_marked_at, completion_confirmed_at")
    .eq("booking_id", params.bookingId)
    .eq("driver_id", auth.driver.id)
    .maybeSingle();
  if (!assignment) return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
  if (assignment.completion_marked_at) {
    return NextResponse.json({ success: false, error: "Already marked done" }, { status: 400 });
  }

  const { error } = await supabase
    .from("booking_driver_assignments")
    .update({ completion_marked_at: new Date().toISOString() })
    .eq("id", assignment.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const { data: booking } = await supabase.from("bookings").select("reference").eq("id", params.bookingId).maybeSingle();

  await supabase.from("activity_log").insert({
    booking_id: params.bookingId,
    action: `${auth.driver.preferred_name || auth.driver.first_name} marked their ${assignment.role === "porter" ? "porter" : "driver"} work done — awaiting confirmation to release pay`,
    metadata: { driver_id: auth.driver.id, assignment_id: assignment.id },
    performed_by: "driver",
  });

  try {
    await sendAdminPush({
      title: "Job marked done",
      body: `${auth.driver.preferred_name || auth.driver.first_name} says ${booking?.reference ?? "a job"} is done — confirm to release their pay.`,
      data: { bookingId: params.bookingId },
    });
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true });
}
