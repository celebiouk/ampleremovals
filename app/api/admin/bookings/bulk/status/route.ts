/**
 * PATCH /api/admin/bookings/bulk/status — bulk update booking status
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "ids array required and must not be empty" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: "status required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Update all bookings
    const { error } = await supabase
      .from("bookings")
      .update({ status, updated_at: now })
      .in("id", ids);

    if (error) {
      throw new Error(`Failed to update bookings: ${error.message}`);
    }

    // Log to activity_log for each booking
    const activities = ids.map((id: string) => ({
      booking_id: id,
      action: `Status changed to ${status}`,
      metadata: { new_status: status },
      performed_by: "admin",
    }));

    await supabase.from("activity_log").insert(activities);

    return NextResponse.json({
      success: true,
      count: ids.length,
      message: `Updated ${ids.length} booking(s) to ${status}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
