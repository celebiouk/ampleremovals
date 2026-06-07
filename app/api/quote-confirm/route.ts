import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyQuoteConfirmToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/resend";

/**
 * POST /api/quote-confirm
 * Confirms a quote and updates booking status to deposit_invoice_sent
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, token } = await req.json();

    if (!bookingId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing bookingId or token" },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = verifyQuoteConfirmToken(bookingId, token, 48);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired confirmation link" },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Check if already confirmed
    const { data: existing } = await supabase
      .from("quote_confirmations")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("token", token)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Quote already confirmed" },
        { status: 409 }
      );
    }

    // Get client info for logging
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Record confirmation
    const { error: insertError } = await supabase
      .from("quote_confirmations")
      .insert({
        booking_id: bookingId,
        token,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (insertError) {
      console.error("Failed to record confirmation:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to record confirmation" },
        { status: 500 }
      );
    }

    // Update booking status to deposit_invoice_sent
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "deposit_invoice_sent" })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to update booking status:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update booking status" },
        { status: 500 }
      );
    }

    // Add to status history
    await supabase.from("status_history").insert({
      booking_id: bookingId,
      previous_status: "pending", // Assuming quotes are sent during pending
      new_status: "deposit_invoice_sent",
      changed_by: "system",
      reason: "Customer confirmed quote via email",
    });

    // Add to activity log
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      actor: "customer",
      action: "quote_confirmed",
      description: "Customer confirmed quote via email link",
      metadata: { ip_address: ipAddress },
    });

    // Fetch booking details for email
    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, customer_name, customer_email, service_type")
      .eq("id", bookingId)
      .single();

    if (booking) {
      // Send confirmation email to customer
      await sendEmail({
        to: booking.customer_email,
        subject: `Quote Confirmed - ${booking.reference}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6b21a8;">Quote Confirmed!</h1>
            <p>Hi ${booking.customer_name},</p>
            <p>Thank you for confirming your quote for <strong>${booking.service_type}</strong>.</p>
            <p>Your booking reference is: <strong>${booking.reference}</strong></p>
            <p>We're preparing your deposit invoice and will send it to you shortly.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 14px; color: #64748b;">
              Best regards,<br><br>
              Daniel<br>
              Ample Removal Team<br>
              07344683477
            </p>
          </div>
        `,
      });

      // Notify admin
      await sendEmail({
        to: ["bookings@ampleremovals.com", "rita@ampleremovals.com", "amanda@ampleremovals.com"],
        subject: `🎉 Quote Confirmed - ${booking.reference}`,
        html: `
          <div style="font-family: sans-serif;">
            <h2 style="color: #16a34a;">Customer Confirmed Quote</h2>
            <p><strong>${booking.customer_name}</strong> confirmed their quote via email.</p>
            <p><strong>Booking:</strong> ${booking.reference}</p>
            <p><strong>Service:</strong> ${booking.service_type}</p>
            <p><strong>Next step:</strong> Send deposit invoice</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings/${bookingId}" style="display: inline-block; padding: 10px 20px; background: #6b21a8; color: white; text-decoration: none; border-radius: 6px;">View Booking</a></p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
