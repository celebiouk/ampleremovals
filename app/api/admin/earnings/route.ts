import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/earnings
 * Fetch all driver earnings
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: earnings, error } = await supabase
      .from("driver_earnings")
      .select(`
        *,
        driver:drivers(first_name, last_name),
        booking:bookings(reference)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch earnings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch earnings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      earnings: earnings || [],
    });
  } catch (error) {
    console.error("GET /api/admin/earnings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
