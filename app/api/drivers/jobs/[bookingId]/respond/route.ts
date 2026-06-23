/**
 * POST /api/drivers/jobs/[bookingId]/respond — in-app accept/decline for the
 * signed-in driver. Decline requires a reason. Mirrors the token-gated /drivers/respond
 * web flow but uses the driver session.
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAdminPush } from "@/lib/push-dispatch";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null) as { action?: string; reason?: string } | null;
    const action = body?.action;
    const reason = (body?.reason ?? "").toString().trim();
    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
    if (action === "decline" && !reason) {
      return NextResponse.json({ success: false, error: "Please give a reason for declining." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: assignment } = await supabase
      .from("booking_driver_assignments")
      .select("id")
      .eq("booking_id", params.bookingId)
      .eq("driver_id", auth.driver.id)
      .maybeSingle();
    if (!assignment) return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });

    const status = action === "accept" ? "accepted" : "declined";
    const { error } = await supabase
      .from("booking_driver_assignments")
      .update({ acceptance_status: status, responded_at: new Date().toISOString(), decline_reason: action === "decline" ? reason : null })
      .eq("id", assignment.id);
    if (error) return NextResponse.json({ success: false, error: "Couldn't save your response." }, { status: 500 });

    const { data: booking } = await supabase.from("bookings").select("reference").eq("id", params.bookingId).single();
    const name = auth.driver.preferred_name || auth.driver.first_name || "Driver";
    const ref = booking?.reference ?? "";
    await supabase.from("activity_log").insert({
      booking_id: params.bookingId,
      action: `Driver ${status} the job: ${name}${action === "decline" ? ` — reason: ${reason}` : ""}`,
      metadata: { driverId: auth.driver.id, status, reason: action === "decline" ? reason : null },
      performed_by: "driver",
    });
    try {
      await supabase.from("notifications").insert({
        type: "driver_response",
        title: action === "accept" ? "Driver accepted job" : "⚠️ Driver declined job",
        description: `${name} ${status} job ${ref}${action === "decline" ? ` — "${reason}"` : ""}.`,
        booking_id: params.bookingId,
      });
    } catch { /* non-critical */ }
    await sendAdminPush({
      title: action === "accept" ? "✅ Driver accepted" : "⚠️ Driver declined",
      body: `${name} ${status} job ${ref}${action === "decline" ? " — reassign needed" : ""}.`,
      data: { bookingId: params.bookingId },
    }).catch(() => {});

    return NextResponse.json({ success: true, status });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
