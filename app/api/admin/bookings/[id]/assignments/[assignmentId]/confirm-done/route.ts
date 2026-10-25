/**
 * POST /api/admin/bookings/[id]/assignments/[assignmentId]/confirm-done —
 * admin confirms a worker's "I'm done" is genuine. This IS the approval: it
 * flips that assignment's driver_earnings straight to 'approved' (ready to
 * pay), skipping the separate pending→approve step the legacy %-of-invoice
 * path still uses. No email here — the worker hears from us at actual
 * payment time (see /api/admin/earnings/pay), not at every status change.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string; assignmentId: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as { reject?: boolean } | null;

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("booking_driver_assignments")
    .select("id, driver_id, completion_marked_at, completion_confirmed_at, driver:drivers(first_name, last_name)")
    .eq("id", params.assignmentId)
    .eq("booking_id", params.id)
    .maybeSingle();
  if (!assignment) return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
  if (!assignment.completion_marked_at) {
    return NextResponse.json({ success: false, error: "Worker hasn't marked this done yet" }, { status: 400 });
  }
  if (assignment.completion_confirmed_at) {
    return NextResponse.json({ success: false, error: "Already confirmed" }, { status: 400 });
  }

  if (body?.reject) {
    // Not actually done (or disputed) — clear the mark so the worker can
    // re-flag it once it genuinely is. Earnings stay un-payable either way.
    const { error: rejectErr } = await supabase
      .from("booking_driver_assignments")
      .update({ completion_marked_at: null })
      .eq("id", assignment.id);
    if (rejectErr) return NextResponse.json({ success: false, error: rejectErr.message }, { status: 500 });

    const driverLabel = Array.isArray(assignment.driver) ? assignment.driver[0] : assignment.driver;
    await supabase.from("activity_log").insert({
      booking_id: params.id,
      action: `Admin rejected ${driverLabel?.first_name ?? "worker"}'s completion mark — not confirmed done`,
      metadata: { assignment_id: assignment.id, driver_id: assignment.driver_id },
      performed_by: "admin",
    });
    return NextResponse.json({ success: true, rejected: true });
  }

  const { error } = await supabase
    .from("booking_driver_assignments")
    .update({ completion_confirmed_at: new Date().toISOString(), completion_confirmed_by: "admin" })
    .eq("id", assignment.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await supabase
    .from("driver_earnings")
    .update({ status: "approved" })
    .eq("assignment_id", assignment.id)
    .eq("status", "awaiting_confirmation");

  const driver = Array.isArray(assignment.driver) ? assignment.driver[0] : assignment.driver;
  await supabase.from("activity_log").insert({
    booking_id: params.id,
    action: `Admin confirmed ${driver?.first_name ?? "worker"}'s job completion — earnings approved`,
    metadata: { assignment_id: assignment.id, driver_id: assignment.driver_id },
    performed_by: "admin",
  });

  return NextResponse.json({ success: true });
}
