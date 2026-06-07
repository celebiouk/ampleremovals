import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuoteLineItem } from "@/types";

/**
 * PATCH /api/admin/bookings/[id]/quote/save
 * Save quote data to a booking (without sending).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const body = await req.json() as {
      line_items: QuoteLineItem[];
      subtotal: number;
      vat_rate: number;
      vat_amount: number;
      total: number;
      valid_until: string;
      notes?: string;
    };

    const supabase = await createClient();

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, reference")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Update booking with quote data
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        quote_line_items: body.line_items,
        quote_subtotal: body.subtotal,
        quote_vat_rate: body.vat_rate,
        quote_vat_amount: body.vat_amount,
        quote_total: body.total,
        quote_valid_until: body.valid_until,
        quote_notes: body.notes || null,
      })
      .eq("id", bookingId);

    if (updateError) {
      await supabase.from("server_logs").insert({
        level: "error",
        message: "Failed to save quote",
        metadata: { booking_id: bookingId, error: updateError },
      });
      return NextResponse.json(
        { success: false, error: "Failed to save quote" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Quote saved",
      metadata: { total: body.total },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Quote save exception",
      metadata: { error: String(err) },
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
