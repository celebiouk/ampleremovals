/**
 * POST /api/drivers/jobs/[bookingId]/waiver — record a signed liability waiver.
 * Used when the customer hasn't protected their goods/property and agrees (per the
 * website T&Cs) to waive our liability. Stores signer name + signature URL + time.
 */
import { NextResponse } from "next/server";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { signer_name, signature_url } = await req.json();
    if (!signer_name?.trim()) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    if (!signature_url) return NextResponse.json({ success: false, error: "Signature required" }, { status: 400 });

    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }

    await supabase.from("bookings").update({
      waiver_signed: true,
      waiver_signer_name: signer_name.trim(),
      waiver_signature_url: signature_url,
      waiver_signed_at: new Date().toISOString(),
    }).eq("id", params.bookingId);

    await supabase.from("activity_log").insert({
      booking_id: params.bookingId,
      action: `Liability waiver signed by ${signer_name.trim()}`,
      metadata: { driver_id: auth.driver.id },
      performed_by: "driver",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
