import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/bookings/[id]/drivers
 * Get assigned drivers for a booking
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    const supabase = createAdminClient();

    const { data: assignments, error } = await supabase
      .from("booking_driver_assignments")
      .select(`
        *,
        driver:drivers(*)
      `)
      .eq("booking_id", bookingId);

    if (error) {
      console.error("Fetch assignments error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch drivers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
    });
  } catch (error) {
    console.error("GET drivers error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[id]/drivers
 * Remove driver assignment
 */
export async function DELETE(req: NextRequest) {
  try {
    const { assignmentId } = await req.json();

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "Assignment ID required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("booking_driver_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      console.error("Delete assignment error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to remove driver" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE driver error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
