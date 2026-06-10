import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

// Admin ALERT recipient — intentionally the company mobile (0333 landline numbers cannot receive SMS/WhatsApp). Public/customer-facing number is 0333 577 2070.
const ADMIN_PHONE = "07344683477";

/**
 * POST /api/address-confirm/update
 * Updates addresses and marks as confirmed
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, token, originAddress, destinationAddress } = body;

    if (!bookingId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing booking ID or token" },
        { status: 400 }
      );
    }

    if (!originAddress && !destinationAddress) {
      return NextResponse.json(
        { success: false, error: "Must provide at least one address to update" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify token and get current booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        origin_address_id,
        destination_address_id,
        address_confirmation_token,
        customer:customers!inner(full_name, email, phone)
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

    // Update origin address if provided
    if (originAddress) {
      const { error: originError } = await supabase
        .from("addresses")
        .update({
          line_1: originAddress.line_1,
          line_2: originAddress.line_2 || null,
          city: originAddress.city || null,
          postcode: originAddress.postcode,
        })
        .eq("id", booking.origin_address_id);

      if (originError) {
        console.error("Update origin address error:", originError);
        return NextResponse.json(
          { success: false, error: "Failed to update origin address" },
          { status: 500 }
        );
      }
    }

    // Update destination address if provided
    if (destinationAddress) {
      const { error: destError } = await supabase
        .from("addresses")
        .update({
          line_1: destinationAddress.line_1,
          line_2: destinationAddress.line_2 || null,
          city: destinationAddress.city || null,
          postcode: destinationAddress.postcode,
        })
        .eq("id", booking.destination_address_id);

      if (destError) {
        console.error("Update destination address error:", destError);
        return NextResponse.json(
          { success: false, error: "Failed to update destination address" },
          { status: 500 }
        );
      }
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
      action: "Customer updated and confirmed addresses",
      metadata: {
        origin_updated: !!originAddress,
        destination_updated: !!destinationAddress,
      },
      performed_by: "customer",
    });

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };

    const formatAddress = (addr: { line_1: string; line_2?: string; city?: string; postcode: string }) => {
      return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
    };

    const originAddressStr = originAddress ? formatAddress(originAddress) : "Not changed";
    const destAddressStr = destinationAddress ? formatAddress(destinationAddress) : "Not changed";

    // Notify admin about updated addresses
    const emailSubject = `🔄 ${customer.full_name} Updated Addresses - ${booking.reference}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔄 Addresses Updated by Customer</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">
            <strong>${customer.full_name}</strong> has updated their addresses for today's move.
          </p>

          ${originAddress ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">📍 NEW Pick-up Address:</p>
              <p style="margin: 0; color: #334155;">${originAddressStr}</p>
            </div>
          ` : ''}

          ${destinationAddress ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">🏁 NEW Delivery Address:</p>
              <p style="margin: 0; color: #334155;">${destAddressStr}</p>
            </div>
          ` : ''}

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

    // SMS
    const smsBody = `🔄 ${customer.full_name} UPDATED addresses!\n\n${booking.reference}\n📍 Pick-up: ${originAddressStr}\n🏁 Delivery: ${destAddressStr}`;

    try {
      await sendSMS(ADMIN_PHONE, smsBody);
    } catch (smsErr) {
      console.error("Admin SMS failed:", smsErr);
    }

    // WhatsApp
    const whatsappBody = `🔄 *Addresses Updated!*\n\n${customer.full_name}\n${booking.reference}\n\n📍 *Pick-up:* ${originAddressStr}\n🏁 *Delivery:* ${destAddressStr}`;

    try {
      await sendWhatsApp(ADMIN_PHONE, whatsappBody);
    } catch (whatsappErr) {
      console.error("Admin WhatsApp failed:", whatsappErr);
    }

    return NextResponse.json({
      success: true,
      message: "Addresses updated successfully",
    });
  } catch (error) {
    console.error("Update addresses error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
