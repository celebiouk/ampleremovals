import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";

/**
 * POST /api/quote-confirm/validate
 * Validates a quote confirmation token and returns quote details
 */
export async function POST(req: NextRequest) {
  try {
    console.log("🔐 Quote validation called");
    const { bookingId, token } = await req.json();
    console.log("  bookingId:", bookingId);
    console.log("  token:", token?.substring(0, 20) + "...");

    if (!bookingId || !token) {
      console.log("❌ Missing params");
      return NextResponse.json(
        { success: false, error: "Missing bookingId or token", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    // Verify token signature and expiry
    console.log("🔍 Verifying token...");
    const isValid = verifyQuoteConfirmToken(bookingId, token, 48);
    console.log("  Token valid:", isValid);

    if (!isValid) {
      console.log("❌ Invalid token");
      return NextResponse.json(
        { success: false, error: "Invalid or expired confirmation link", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    // Check if already confirmed (skip if table doesn't exist yet)
    const supabase = await createClient();
    try {
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
    } catch (tableError) {
      // Table might not exist yet - that's OK, just skip the check
      console.warn("quote_confirmations table check failed (table may not exist):", tableError);
    }

    // Fetch quote details with customer join
    console.log("📋 Fetching booking...");
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        quote_total,
        customer:customers(full_name)
      `)
      .eq("id", bookingId)
      .single();

    console.log("  Booking data:", booking);
    console.log("  Fetch error:", fetchError);

    if (fetchError || !booking) {
      console.error("❌ Booking fetch failed:", fetchError?.message || "No booking returned");
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
          code: "NOT_FOUND",
          details: fetchError?.message,
        },
        { status: 404 }
      );
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    console.log("✅ Booking found:", booking.reference);

    return NextResponse.json({
      success: true,
      quote: {
        reference: booking.reference,
        service_type: booking.service_type,
        customer_name: customer?.full_name || "Customer",
        total: booking.quote_total || 0,
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
