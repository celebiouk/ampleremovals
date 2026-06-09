import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

const ADMIN_PHONE = "07344683477";

/**
 * POST /api/survey/submit
 * Submits survey rating and optional feedback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, rating, feedback } = body;

    if (!bookingId || !rating) {
      return NextResponse.json(
        { success: false, error: "Missing booking ID or rating" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be 1-5" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify booking exists
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
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

    // Save rating
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        survey_rating: rating,
        survey_feedback: feedback || null,
        survey_completed_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Update survey error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to save survey" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Customer rated service: ${rating}/5 stars`,
      metadata: { rating, has_feedback: !!feedback },
      performed_by: "customer",
    });

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };

    // Notify admin of feedback (especially if rating is low)
    if (rating <= 3 || feedback) {
      const ratingEmoji = rating === 5 ? "⭐⭐⭐⭐⭐" : rating === 4 ? "⭐⭐⭐⭐" : rating === 3 ? "⭐⭐⭐" : rating === 2 ? "⭐⭐" : "⭐";
      const ratingColor = rating >= 4 ? "#16a34a" : rating === 3 ? "#f59e0b" : "#dc2626";

      const emailSubject = rating <= 3
        ? `⚠️ Low Rating Alert: ${customer.full_name} - ${rating}/5 stars`
        : `📊 Customer Feedback: ${customer.full_name} - ${rating}/5 stars`;

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${ratingColor}; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">📊 Survey Response Received</h1>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">
              <strong>${customer.full_name}</strong> rated their experience:
            </p>

            <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 48px;">${ratingEmoji}</p>
              <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: ${ratingColor};">${rating}/5 Stars</p>
            </div>

            ${feedback ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">Customer Feedback:</p>
                <p style="margin: 0; color: #78350f; font-style: italic;">"${feedback}"</p>
              </div>
            ` : ""}

            ${rating <= 3 ? `
              <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-weight: bold;">⚠️ Action Required</p>
                <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px;">
                  Low rating detected. Please follow up with the customer to address their concerns.
                </p>
              </div>
            ` : ""}

            <p style="font-size: 14px; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <strong>Booking:</strong> ${booking.reference}<br>
              <strong>Service:</strong> ${booking.service_type.replace(/_/g, " ")}<br>
              <strong>Customer:</strong> ${customer.full_name} - ${customer.phone}
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
        console.error("Admin notification failed:", emailErr);
      }

      // SMS/WhatsApp for low ratings only
      if (rating <= 3) {
        const alertMessage = `⚠️ LOW RATING: ${customer.full_name} rated ${rating}/5 stars\n\n${booking.reference}${feedback ? `\n\nFeedback: "${feedback}"` : ""}\n\nCall: ${customer.phone}`;

        try {
          await sendSMS(ADMIN_PHONE, alertMessage);
        } catch (smsErr) {
          console.error("Admin SMS failed:", smsErr);
        }

        try {
          await sendWhatsApp(ADMIN_PHONE, `⚠️ *LOW RATING ALERT*\n\n${customer.full_name} rated *${rating}/5 stars*\n\n${booking.reference}${feedback ? `\n\n*Feedback:* "${feedback}"` : ""}\n\nCall: ${customer.phone}`);
        } catch (whatsappErr) {
          console.error("Admin WhatsApp failed:", whatsappErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback!",
    });
  } catch (error) {
    console.error("Survey submit error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
