import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/drivers/[id]
 * Fetch single driver details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch driver
    const { data: driver, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    // Get job count
    const { count: jobCount } = await supabase
      .from("booking_driver_assignments")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", id);

    // Get earnings summary
    const { data: earnings } = await supabase
      .from("driver_earnings")
      .select("total_earnings, status")
      .eq("driver_id", id);

    const earningsSummary = {
      total: earnings?.reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
      pending: earnings?.filter((e) => e.status === "pending").reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
      approved: earnings?.filter((e) => e.status === "approved").reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
      paid: earnings?.filter((e) => e.status === "paid").reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      driver: {
        ...driver,
        job_count: jobCount || 0,
        earnings_summary: earningsSummary,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/drivers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/drivers/[id]
 * Update driver details
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const supabase = createAdminClient();

    // Update driver
    const { data: driver, error } = await supabase
      .from("drivers")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update driver error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update driver" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      action: `Driver updated: ${driver.first_name} ${driver.last_name}`,
      metadata: { driver_id: id },
    });

    return NextResponse.json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("PATCH /api/admin/drivers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
