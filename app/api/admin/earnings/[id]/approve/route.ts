import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/earnings/[id]/approve
 * Approve driver earnings
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Update earning status to approved
    const { data: earning, error } = await supabase
      .from("driver_earnings")
      .update({ status: "approved" })
      .eq("id", id)
      .select("*, driver:drivers(first_name, last_name, email)")
      .single();

    if (error) {
      console.error("Approve earnings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to approve earnings" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: earning.booking_id,
      action: `Earnings approved: £${earning.total_earnings.toFixed(2)} for ${earning.driver?.first_name} ${earning.driver?.last_name}`,
      metadata: { earning_id: id },
    });

    // TODO: Send notification email to driver about approved earnings

    return NextResponse.json({
      success: true,
      earning,
    });
  } catch (error) {
    console.error("POST approve earnings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
