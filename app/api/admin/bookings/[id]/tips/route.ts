import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/bookings/[id]/tips
 * Record a tip for a driver on a booking
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    const { driverId, amount, note } = await req.json();

    if (!driverId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Driver and a positive tip amount are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Insert tip record
    const { data: tip, error: tipError } = await supabase
      .from("driver_tips")
      .insert({
        driver_id: driverId,
        booking_id: bookingId,
        amount,
        recorded_by: "admin",
        note: note || null,
      })
      .select()
      .single();

    if (tipError) {
      console.error("Tip insert error:", tipError);
      return NextResponse.json(
        { success: false, error: "Failed to record tip" },
        { status: 500 }
      );
    }

    // If earnings already exist for this driver+booking, update them with the new tip
    const { data: existingEarning } = await supabase
      .from("driver_earnings")
      .select("id, gross_earnings, tip_amount")
      .eq("driver_id", driverId)
      .eq("booking_id", bookingId)
      .single();

    if (existingEarning) {
      const newTipTotal = (existingEarning.tip_amount || 0) + amount;
      const newTotal = (existingEarning.gross_earnings || 0) + newTipTotal;
      await supabase
        .from("driver_earnings")
        .update({
          tip_amount: newTipTotal,
          total_earnings: newTotal,
        })
        .eq("id", existingEarning.id);
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Tip recorded: £${amount.toFixed(2)}`,
      metadata: { driver_id: driverId, tip_id: tip.id },
      performed_by: "admin",
    });

    return NextResponse.json({
      success: true,
      tip,
    });
  } catch (error) {
    console.error("POST tips error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
