import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/tip/booking/[bookingId]
 * Get booking details for tip page
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params;

    const supabase = createAdminClient();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        status,
        customer:customers!inner(full_name)
      `)
      .eq("id", bookingId)
      .eq("status", "job_completed")
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or not completed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
