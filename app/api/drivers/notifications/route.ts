/**
 * GET /api/drivers/notifications — a unified activity feed for the signed-in
 * driver: recent activity_log entries across the jobs they're assigned to
 * (status changes, journey events, pickup/delivery confirmations). Read-only.
 */

import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();

    const { data: assignments } = await supabase
      .from("booking_driver_assignments")
      .select("booking_id")
      .eq("driver_id", auth.driver.id);
    const bookingIds = (assignments ?? []).map((a) => a.booking_id);
    if (bookingIds.length === 0) return NextResponse.json({ success: true, notifications: [] });

    const { data: logs } = await supabase
      .from("activity_log")
      .select("id, booking_id, action, created_at, booking:bookings(reference, service_type)")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false })
      .limit(50);

    const notifications = (logs ?? []).map((l) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = (l as any).booking;
      return {
        id: l.id,
        title: b?.reference ? `${b.reference}` : "Job update",
        description: l.action,
        is_read: true,
        created_at: l.created_at,
        booking_id: l.booking_id,
      };
    });

    return NextResponse.json({ success: true, notifications });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
