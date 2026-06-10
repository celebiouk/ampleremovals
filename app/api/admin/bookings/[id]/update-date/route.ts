import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * POST /api/admin/bookings/[id]/update-date
 * Admin updates move date for a booking
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    const body = await req.json();
    const { moveDate, moveTime, notify = true } = body;

    if (!moveDate) {
      return NextResponse.json(
        { success: false, error: "Move date is required" },
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
        move_date,
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
    const oldDate = booking.move_date;

    // Update move date
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ move_date: moveDate })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update move date" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Move date updated by admin",
      metadata: { old_date: oldDate, new_date: moveDate, time: moveTime || null },
      performed_by: "admin",
    });

    const oldDateFormatted = oldDate ? new Date(oldDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }) : "Not set";

    const newDateFormatted = new Date(moveDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    // Only notify customer if requested
    if (notify) {
      // Notify customer
      const emailSubject = `📅 Move Date Updated - ${booking.reference}`;
      const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">📅 Move Date Updated</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
          <p style="font-size: 16px; color: #1e293b; margin: 20px 0;">
            Your move date has been updated.
          </p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Previous Date:</strong></td>
                <td style="padding: 8px 0; color: #92400e;">${oldDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>New Date:</strong></td>
                <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${newDateFormatted}${moveTime ? ` at ${moveTime}` : ""}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 14px; color: #64748b;">
            If you have any questions, please contact us on 0333 577 2070.
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
        `📅 Move date updated!\n\nNew date: ${newDateFormatted}${moveTime ? ` at ${moveTime}` : ""}\n\nQuestions? Call 03335772070\n\nRef: ${booking.reference}`
      );
    } catch (smsErr) {
      console.error("SMS failed:", smsErr);
    }

      // WhatsApp
      try {
        await sendWhatsApp(
          customer.phone,
          `📅 *Move Date Updated*\n\nHi ${customer.full_name},\n\nYour move date has been updated:\n\n*New Date:* ${newDateFormatted}${moveTime ? `\n*Time:* ${moveTime}` : ""}\n\nQuestions? Call *0333 577 2070*\n\nBooking: ${booking.reference}`
        );
      } catch (whatsappErr) {
        console.error("WhatsApp failed:", whatsappErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: notify
        ? "Move date updated and customer notified"
        : "Move date updated (customer not notified)",
    });
  } catch (error) {
    console.error("Update date error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
