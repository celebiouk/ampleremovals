import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/bookings/[id]/assign-driver
 * Assign a driver to a booking
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    const { driverId, payPercentageOverride, isLeadDriver } = await req.json();

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: "Driver ID required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if already assigned
    const { data: existing } = await supabase
      .from("booking_driver_assignments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("driver_id", driverId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Driver already assigned to this booking" },
        { status: 400 }
      );
    }

    // Get driver details
    const { data: driver } = await supabase
      .from("drivers")
      .select("first_name, last_name, default_pay_percentage")
      .eq("id", driverId)
      .single();

    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from("booking_driver_assignments")
      .insert({
        booking_id: bookingId,
        driver_id: driverId,
        pay_percentage_override: payPercentageOverride,
        is_lead_driver: isLeadDriver ?? false,
      })
      .select()
      .single();

    if (assignError) {
      console.error("Assignment error:", assignError);
      return NextResponse.json(
        { success: false, error: "Failed to assign driver" },
        { status: 500 }
      );
    }

    // Create earnings placeholder (will be calculated when invoice is paid)
    const payPercentage = payPercentageOverride || driver.default_pay_percentage;

    await supabase.from("driver_earnings").insert({
      driver_id: driverId,
      booking_id: bookingId,
      assignment_id: assignment.id,
      booking_total: 0,
      pay_percentage: payPercentage,
      gross_earnings: 0,
      tip_amount: 0,
      total_earnings: 0,
      status: "pending",
    });

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Driver assigned: ${driver.first_name} ${driver.last_name}`,
      metadata: { driver_id: driverId, assignment_id: assignment.id },
      performed_by: "admin",
    });

    // TODO: Send assignment notification to driver

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("POST assign-driver error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
