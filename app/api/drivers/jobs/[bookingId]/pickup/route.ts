/**
 * POST /api/drivers/jobs/[bookingId]/pickup — save the pickup chain-of-custody
 * (name, comments, signature URL). Photos are uploaded to Storage by the app
 * (jobs/[ref]/pickup/photos/). Marks pickup_confirmed and emails the customer a
 * pickup confirmation. All pickup data is then frozen.
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

    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, pickup_confirmed, customer:customers(full_name, email)")
      .eq("id", params.bookingId)
      .single();
    if (booking?.pickup_confirmed) return NextResponse.json({ success: false, error: "Pickup already confirmed" }, { status: 400 });

    await supabase.from("bookings").update({
      pickup_contact_name: contact_name.trim(),
      pickup_comments: comments ?? null,
      pickup_signature_url: signature_url,
      pickup_confirmed: true,
      pickup_confirmed_at: new Date().toISOString(),
    }).eq("id", params.bookingId);

    await supabase.from("activity_log").insert({
      booking_id: params.bookingId,
      action: `Pickup confirmed by ${contact_name.trim()}`,
      metadata: { driver_id: auth.driver.id }, performed_by: "driver",
    });

    // Branded pickup receipt PDF emailed to the customer (best-effort).
    await sendChainReceipt(supabase, params.bookingId, "pickup");

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
