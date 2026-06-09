import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/address-confirm/validate
 * Validates token and returns booking details for address confirmation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, token } = body;

    if (!bookingId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing booking ID or token" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch booking with token validation
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        move_date,
        address_confirmed,
        address_confirmation_token,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(id, line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(id, line_1, line_2, city, postcode)
      `)
      .eq("id", bookingId)
      .eq("address_confirmation_token", token)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired confirmation link" },
        { status: 404 }
      );
    }

    // Check if already confirmed
    if (booking.address_confirmed) {
      const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string };

      return NextResponse.json({
        success: true,
        already_confirmed: true,
        booking: {
          reference: booking.reference,
          customer_name: customer.full_name,
        },
      });
    }

    // Format addresses
    const formatAddress = (addr: { id: string; line_1: string; line_2?: string; city?: string; postcode: string } | null) => {
      if (!addr) return null;
      return {
        id: addr.id,
        line_1: addr.line_1,
        line_2: addr.line_2,
        city: addr.city,
        postcode: addr.postcode,
        full: [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", "),
      };
    };

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string };
    const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin;
    const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination;

    return NextResponse.json({
      success: true,
      already_confirmed: false,
      booking: {
        id: booking.id,
        reference: booking.reference,
        service_type: booking.service_type,
        move_date: booking.move_date,
        customer_name: customer.full_name,
        origin_address: formatAddress(origin),
        destination_address: formatAddress(destination),
      },
    });
  } catch (error) {
    console.error("Validate address confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
