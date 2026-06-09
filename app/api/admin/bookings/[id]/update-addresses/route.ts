import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * POST /api/admin/bookings/[id]/update-addresses
 * Admin updates origin/destination addresses for a booking
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    const body = await req.json();
    const { origin, destination, notify = true } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, error: "Both addresses are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        origin_address_id,
        destination_address_id,
        customer:customers!inner(full_name, email, phone)
      `)
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };

    // Update origin address
    const { error: originError } = await supabase
      .from("addresses")
      .update({
        line_1: origin.line_1,
        line_2: origin.line_2 || null,
        city: origin.city || null,
        postcode: origin.postcode,
      })
      .eq("id", booking.origin_address_id);

    if (originError) {
      return NextResponse.json(
        { success: false, error: "Failed to update origin address" },
        { status: 500 }
      );
    }

    // Update destination address
    const { error: destError } = await supabase
      .from("addresses")
      .update({
        line_1: destination.line_1,
        line_2: destination.line_2 || null,
        city: destination.city || null,
        postcode: destination.postcode,
      })
      .eq("id", booking.destination_address_id);

    if (destError) {
      return NextResponse.json(
        { success: false, error: "Failed to update destination address" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Addresses updated by admin",
      metadata: { origin, destination },
      performed_by: "admin",
    });

    const formatAddress = (addr: typeof origin) => {
      return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
    };

    const originFormatted = formatAddress(origin);
    const destinationFormatted = formatAddress(destination);

    // Only notify customer if requested
    if (notify) {
      // Notify customer
      const emailSubject = `📍 Addresses Updated - ${booking.reference}`;
      const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #9333ea; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">📍 Addresses Updated</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
          <p style="font-size: 16px; color: #1e293b; margin: 20px 0;">
            Your move addresses have been updated.
          </p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #15803d;">Origin Address:</p>
            <p style="margin: 0; color: #166534;">${originFormatted}</p>
          </div>
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af;">Destination Address:</p>
            <p style="margin: 0; color: #1e3a8a;">${destinationFormatted}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">
            If you have any questions, please contact us on 07344 683477.
          </p>
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
            Booking Reference: ${booking.reference}
          </p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: emailSubject,
        html: emailBody,
      });
    } catch (emailErr) {
      console.error("Customer notification failed:", emailErr);
    }

    // SMS
    try {
      await sendSMS(
        customer.phone,
        `📍 Addresses updated!\n\nOrigin: ${originFormatted}\nDestination: ${destinationFormatted}\n\nRef: ${booking.reference}`
      );
    } catch (smsErr) {
      console.error("SMS failed:", smsErr);
    }

      // WhatsApp
      try {
        await sendWhatsApp(
          customer.phone,
          `📍 *Addresses Updated*\n\nHi ${customer.full_name},\n\n*Origin:* ${originFormatted}\n\n*Destination:* ${destinationFormatted}\n\nQuestions? Call *07344 683477*\n\nBooking: ${booking.reference}`
        );
      } catch (whatsappErr) {
        console.error("WhatsApp failed:", whatsappErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: notify
        ? "Addresses updated and customer notified"
        : "Addresses updated (customer not notified)",
    });
  } catch (error) {
    console.error("Update addresses error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
