/**
 * POST /api/admin/anyvan-jobs/[id]/complete — admin marks an AnyVan job done.
 * An AnyVan job has no real addresses/journey, so the driver-app's own
 * "Complete" button (which requires delivery_confirmed from the journey
 * tracker — see app/api/drivers/jobs/[bookingId]/complete/route.ts) can never
 * fire for one. This mirrors that same completion sequence — status +
 * completed_at + the existing rating-request pipeline — triggered by admin
 * instead, since that's who actually knows the job is done.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendRatingRequest } from "@/lib/rating-request";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, reference, is_anyvan, status")
    .eq("id", params.id)
    .eq("is_anyvan", true)
    .maybeSingle();
  if (!booking) return NextResponse.json({ success: false, error: "AnyVan job not found" }, { status: 404 });
  if (booking.status === "job_completed") {
    return NextResponse.json({ success: false, error: "Already marked complete" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await supabase.from("bookings").update({ completed_at: now, status: "job_completed" }).eq("id", booking.id);

  await supabase.from("status_history").insert({
    booking_id: booking.id, status: "job_completed", changed_by: "Admin",
  });
  await supabase.from("activity_log").insert({
    booking_id: booking.id, action: `AnyVan job ${booking.reference} marked complete by admin`, performed_by: "admin",
  });

  await sendRatingRequest(supabase, booking.id);

  return NextResponse.json({ success: true });
}
