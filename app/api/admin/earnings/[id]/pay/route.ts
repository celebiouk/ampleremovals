import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/earnings/[id]/pay
 * Mark driver earnings as paid
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Update earning status to paid
    const { data: earning, error } = await supabase
      .from("driver_earnings")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, driver:drivers(first_name, last_name)")
      .single();

    if (error) {
      console.error("Mark paid error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to mark as paid" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: earning.booking_id,
      action: `Earnings paid: £${earning.total_earnings.toFixed(2)} to ${earning.driver?.first_name} ${earning.driver?.last_name}`,
      metadata: { earning_id: id },
    });

    return NextResponse.json({
      success: true,
      earning,
    });
  } catch (error) {
    console.error("POST pay earnings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
