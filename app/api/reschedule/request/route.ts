import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

const ADMIN_PHONE = "07344683477";

/**
 * POST /api/reschedule/request
 * Customer requests to reschedule their move
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, token, newDate, reason } = body;

    if (!bookingId || !token || !newDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify booking and token
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        move_date,
        reschedule_token,
        customer:customers!inner(full_name, email, phone)
      `)
      .eq("id", bookingId)
      .eq("reschedule_token", token)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: "Invalid booking or token" },
        { status: 404 }
      );
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };

    // Update booking with reschedule request
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        reschedule_requested_at: new Date().toISOString(),
        reschedule_new_date: newDate,
        reschedule_reason: reason || null,
      })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to save reschedule request" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Reschedule requested",
      metadata: { old_date: booking.move_date, new_date: newDate, reason },
      performed_by: "customer",
    });

    const oldDate = new Date(booking.move_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const newDateFormatted = new Date(newDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    // Notify admin via email, SMS, and WhatsApp
    const adminEmailSubject = `📅 Reschedule Request: ${customer.full_name} - ${booking.reference}`;
    const adminEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">📅 Reschedule Request</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b;">
            <strong>${customer.full_name}</strong> has requested to reschedule their move.
          </p>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Booking:</strong></td>
                <td style="padding: 8px 0; color: #92400e;">${booking.reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Customer:</strong></td>
                <td style="padding: 8px 0; color: #92400e;">${customer.full_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Phone:</strong></td>
                <td style="padding: 8px 0; color: #92400e;"><a href="tel:${customer.phone}">${customer.phone}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Current Date:</strong></td>
                <td style="padding: 8px 0; color: #92400e;">${oldDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Requested Date:</strong></td>
                <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${newDateFormatted}</td>
              </tr>
              ${reason ? `
              <tr>
                <td style="padding: 8px 0; color: #78350f;" valign="top"><strong>Reason:</strong></td>
                <td style="padding: 8px 0; color: #92400e;">${reason}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings/${bookingId}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 8px;">
              Approve Reschedule
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b;">
            Review this request in the admin dashboard and update the booking if approved.
          </p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
        to: resendAdminEmails,
        subject: adminEmailSubject,
        html: adminEmailBody,
      });
    } catch (emailErr) {
      console.error("Admin notification failed:", emailErr);
    }

    // SMS to admin
    try {
      await sendSMS(
        ADMIN_PHONE,
        `📅 RESCHEDULE REQUEST\n\n${customer.full_name}\n${booking.reference}\n\nFrom: ${oldDate}\nTo: ${newDateFormatted}\n\n${reason ? `Reason: ${reason}\n\n` : ""}View: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings/${bookingId}`
      );
    } catch (smsErr) {
      console.error("Admin SMS failed:", smsErr);
    }

    // WhatsApp to admin
    try {
      await sendWhatsApp(
        ADMIN_PHONE,
        `📅 *RESCHEDULE REQUEST*\n\n*Customer:* ${customer.full_name}\n*Booking:* ${booking.reference}\n*Phone:* ${customer.phone}\n\n*Current Date:* ${oldDate}\n*Requested Date:* ${newDateFormatted}\n\n${reason ? `*Reason:* ${reason}\n\n` : ""}Review in dashboard:\n${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings/${bookingId}`
      );
    } catch (whatsappErr) {
      console.error("Admin WhatsApp failed:", whatsappErr);
    }

    return NextResponse.json({
      success: true,
      message: "Reschedule request submitted successfully",
    });
  } catch (error) {
    console.error("Reschedule request error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
