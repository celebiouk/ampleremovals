import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

/**
 * POST /api/tip/create-session
 * Create Stripe checkout session for driver tip
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, amount, message } = body;

    if (!bookingId || !amount || amount < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get booking details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        customer_id,
        customer:customers!inner(full_name, email)
      `)
      .eq("id", bookingId)
      .eq("status", "job_completed")
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string };

    // Create tip record
    const { data: tipRecord, error: tipError } = await supabase
      .from("driver_tips")
      .insert({
        booking_id: bookingId,
        customer_id: booking.customer_id,
        amount,
        tip_message: message || null,
        stripe_payment_status: "pending",
      })
      .select()
      .single();

    if (tipError || !tipRecord) {
      return NextResponse.json(
        { success: false, error: "Failed to create tip record" },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Driver Tip - ${booking.reference}`,
              description: message ? `Message: ${message}` : "Thank you for your service!",
            },
            unit_amount: Math.round(amount * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tip/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tip/${bookingId}`,
      customer_email: customer.email,
      metadata: {
        tip_id: tipRecord.id,
        booking_id: bookingId,
        booking_reference: booking.reference,
      },
    });

    // Update tip record with payment intent
    await supabase
      .from("driver_tips")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", tipRecord.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create tip session error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
