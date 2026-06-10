import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

const ADMIN_PHONE = "03335772070";

/**
 * POST /api/address-confirm/confirm
 * Confirms addresses are correct
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

    // Verify token
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        move_date,
        address_confirmation_token,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("id", bookingId)
      .eq("address_confirmation_token", token)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: "Invalid confirmation link" },
        { status: 404 }
      );
    }

    // Mark as confirmed
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        address_confirmed: true,
        address_confirmed_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Update booking error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to confirm addresses" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Customer confirmed addresses",
      metadata: { confirmed_at: new Date().toISOString() },
      performed_by: "customer",
    });

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };
    const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin as { line_1: string; line_2?: string; city?: string; postcode: string };
    const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination as { line_1: string; line_2?: string; city?: string; postcode: string };

    const formatAddress = (addr: typeof origin) => {
      return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
    };

    const originAddress = formatAddress(origin);
    const destinationAddress = formatAddress(destination);

    // Notify admin that customer confirmed
    const emailSubject = `✅ ${customer.full_name} Confirmed Addresses - ${booking.reference}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">✅ Addresses Confirmed</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">
            <strong>${customer.full_name}</strong> has confirmed their addresses for today's move.
          </p>

          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #15803d;">📍 Pick-up:</p>
            <p style="margin: 0; color: #334155;">${originAddress}</p>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">🏁 Delivery:</p>
            <p style="margin: 0; color: #334155;">${destinationAddress}</p>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            Booking: <strong>${booking.reference}</strong><br>
            Customer: ${customer.full_name} - ${customer.phone}
          </p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
        to: resendAdminEmails,
        subject: emailSubject,
        html: emailBody,
      });
    } catch (emailErr) {
      console.error("Admin email failed:", emailErr);
    }

    // SMS to admin
    const smsBody = `✅ ${customer.full_name} confirmed addresses!\n\n${booking.reference}\n📍 From: ${originAddress}\n🏁 To: ${destinationAddress}`;

    try {
      await sendSMS(ADMIN_PHONE, smsBody);
    } catch (smsErr) {
      console.error("Admin SMS failed:", smsErr);
    }

    // WhatsApp to admin
    const whatsappBody = `✅ *Addresses Confirmed!*\n\n${customer.full_name}\n${booking.reference}\n\n📍 *Pick-up:* ${originAddress}\n🏁 *Delivery:* ${destinationAddress}`;

    try {
      await sendWhatsApp(ADMIN_PHONE, whatsappBody);
    } catch (whatsappErr) {
      console.error("Admin WhatsApp failed:", whatsappErr);
    }

    return NextResponse.json({
      success: true,
      message: "Addresses confirmed successfully",
    });
  } catch (error) {
    console.error("Confirm addresses error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
