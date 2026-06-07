import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";

/**
 * POST /api/quote-confirm/validate
 * Validates a quote confirmation token and returns quote details
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, token } = await req.json();

    if (!bookingId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId or token", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    // Verify token signature and expiry
    const isValid = verifyQuoteConfirmToken(bookingId, token, 48);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired confirmation link", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    // Check if already confirmed
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("quote_confirmations")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("token", token)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This quote has already been confirmed", code: "ALREADY_CONFIRMED" },
        { status: 409 }
      );
    }

    // Fetch quote details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, reference, service_type, customer_name, total")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: {
        reference: booking.reference,
        service_type: booking.service_type,
        customer_name: booking.customer_name,
        total: booking.total,
      },
    });
  } catch (error) {
    console.error("Quote validation error:", error);
    return NextResponse.json(
      { success: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
