/**
 * POST /api/drivers/jobs/[bookingId]/incident — record an access/damage-risk
 * incident: the driver hit a specific risk (an item/doorway/property situation
 * that could cause damage), told the customer, and the customer agreed to
 * proceed anyway. Stores the driver's written account, photos, and the
 * customer's signature for that specific decision. A job can have multiple —
 * unlike the generic one-per-job liability waiver (see the waiver route).
 */
import { NextResponse } from "next/server";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAdminPush } from "@/lib/push-dispatch";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { description, photo_paths, signer_name, signature_url } = await req.json();
    if (!description?.trim()) return NextResponse.json({ success: false, error: "Description required" }, { status: 400 });
    if (!Array.isArray(photo_paths) || photo_paths.length === 0) return NextResponse.json({ success: false, error: "At least one photo is required" }, { status: 400 });
    if (!signer_name?.trim()) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    if (!signature_url) return NextResponse.json({ success: false, error: "Signature required" }, { status: 400 });

    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }

    const { data: booking } = await supabase.from("bookings").select("reference").eq("id", params.bookingId).maybeSingle();

    const { data: incident, error } = await supabase
      .from("job_incidents")
      .insert({
        booking_id: params.bookingId,
        driver_id: auth.driver.id,
        description: description.trim(),
        photo_paths,
        signer_name: signer_name.trim(),
        signature_path: signature_url,
      })
      .select("id")
      .single();
    if (error) throw error;

    await supabase.from("activity_log").insert({
      booking_id: params.bookingId,
      action: `Access/damage risk reported and signed off by ${signer_name.trim()}`,
      metadata: { driver_id: auth.driver.id, incident_id: incident?.id },
      performed_by: "driver",
    });

    // Safety/liability-relevant — admin should know right away, not just find it later.
    const driverLabel = auth.driver.preferred_name || auth.driver.first_name;
    const pushBody = `${driverLabel} — ${booking?.reference ?? "job"}: ${description.trim().slice(0, 120)}`;
    try {
      await supabase.from("notifications").insert({
        type: "job_incident",
        title: "⚠️ Access/damage risk reported",
        description: pushBody,
        booking_id: params.bookingId,
      });
    } catch { /* non-critical */ }
    await sendAdminPush({ title: "⚠️ Access/damage risk reported", body: pushBody, data: { bookingId: params.bookingId } });

    return NextResponse.json({ success: true, id: incident?.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
