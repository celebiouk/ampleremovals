/**
 * POST /api/drivers/jobs/[bookingId]/delivery — save the delivery chain-of-custody
 * (name, comments, signature URL). Photos uploaded to Storage by the app
 * (jobs/[ref]/delivery/photos/). Marks delivery_confirmed. The driver then taps
 * COMPLETE JOB (separate endpoint).
 */

import { NextResponse } from "next/server";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendChainReceipt } from "@/lib/chain-receipt";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { contact_name, comments, signature_url } = await req.json();
    if (!contact_name?.trim()) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    if (!signature_url) return NextResponse.json({ success: false, error: "Signature required" }, { status: 400 });

    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }

    await supabase.from("bookings").update({
      delivery_contact_name: contact_name.trim(),
      delivery_comments: comments ?? null,
      delivery_signature_url: signature_url,
      delivery_confirmed: true,
      delivery_confirmed_at: new Date().toISOString(),
    }).eq("id", params.bookingId);

    await supabase.from("activity_log").insert({
      booking_id: params.bookingId,
      action: `Delivery confirmed by ${contact_name.trim()}`,
      metadata: { driver_id: auth.driver.id }, performed_by: "driver",
    });

    // Branded delivery receipt PDF emailed to the customer (best-effort).
    await sendChainReceipt(supabase, params.bookingId, "delivery");

    return NextResponse.json({ success: true, contact_name: contact_name.trim() });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
