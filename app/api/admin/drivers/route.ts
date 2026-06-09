import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/drivers
 * Fetch all drivers with stats
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all drivers
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch drivers error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch drivers" },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: drivers?.length || 0,
      active: drivers?.filter((d) => d.status === "active").length || 0,
      inactive:
        drivers?.filter((d) =>
          ["inactive", "suspended", "on_leave"].includes(d.status)
        ).length || 0,
      jobsThisWeek: 0, // TODO: Calculate from assignments
    };

    // Enhance drivers with job count and earnings owed
    const enhancedDrivers = await Promise.all(
      (drivers || []).map(async (driver) => {
        // Get job count
        const { count: jobCount } = await supabase
          .from("booking_driver_assignments")
          .select("*", { count: "exact", head: true })
          .eq("driver_id", driver.id);

        // Get earnings owed (approved but not paid)
        const { data: earnings } = await supabase
          .from("driver_earnings")
          .select("total_earnings")
          .eq("driver_id", driver.id)
          .eq("status", "approved");

        const earningsOwed = earnings?.reduce(
          (sum, e) => sum + (e.total_earnings || 0),
          0
        ) || 0;

        return {
          ...driver,
          job_count: jobCount || 0,
          earnings_owed: earningsOwed,
        };
      })
    );

    return NextResponse.json({
      success: true,
      drivers: enhancedDrivers,
      stats,
    });
  } catch (error) {
    console.error("GET /api/admin/drivers error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
