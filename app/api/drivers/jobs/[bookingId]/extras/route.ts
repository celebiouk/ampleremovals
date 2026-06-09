/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/drivers/jobs/[bookingId]/extras
 * Returns co-drivers and the requesting driver's earning for this job.
 * Uses the service role but only after verifying the caller is assigned
 * to the booking, and returns minimal co-driver info (first name + lead).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params;
    const supabase = createAdminClient();

    // Resolve the authenticated driver
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 403 }
      );
    }

    // Verify the caller is assigned to this booking
    const { data: ownAssignment } = await supabase
      .from("booking_driver_assignments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("driver_id", driver.id)
      .single();

    if (!ownAssignment) {
      return NextResponse.json(
        { success: false, error: "Not assigned to this booking" },
        { status: 403 }
      );
    }

    // Co-drivers (everyone else assigned to this booking) — minimal info
    const { data: coAssignments } = await supabase
      .from("booking_driver_assignments")
      .select("is_lead_driver, driver:drivers(first_name, preferred_name)")
      .eq("booking_id", bookingId)
      .neq("driver_id", driver.id);

    const coDrivers = (coAssignments || []).map((a: any) => ({
      name: a.driver?.preferred_name || a.driver?.first_name || "Driver",
      isLead: a.is_lead_driver,
    }));

    // The requesting driver's earning for this job (if calculated yet)
    const { data: earning } = await supabase
      .from("driver_earnings")
      .select("gross_earnings, tip_amount, total_earnings, pay_percentage, status")
      .eq("booking_id", bookingId)
      .eq("driver_id", driver.id)
      .single();

    return NextResponse.json({
      success: true,
      coDrivers,
      earning: earning || null,
    });
  } catch (error) {
    console.error("GET driver job extras error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
