import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";

/**
 * GET /api/cron/send-surveys
 * Runs every 30 minutes
 * Sends post-move survey 2 hours after job completion
 */
export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Find jobs completed 2+ hours ago that haven't received survey
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    console.log(`📊 Looking for jobs completed before ${twoHoursAgo.toISOString()}`);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        job_completed_at,
        customer:customers!inner(full_name, email, phone)
      `)
      .eq("status", "job_completed")
      .not("job_completed_at", "is", null)
      .lte("job_completed_at", twoHoursAgo.toISOString())
      .is("survey_sent_at", null);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for surveys");
      return NextResponse.json({
        success: true,
        message: "No surveys to send",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) needing surveys`);

    // Send surveys
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };

        const surveyBaseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/survey/${booking.id}`;

        const emailSubject = `How did we do? Quick 2-minute survey - ${booking.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 26px;">How Did We Do?</h1>
              <p style="color: #e9d5ff; margin: 0; font-size: 14px;">Your feedback helps us improve!</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                We hope your move went smoothly! We'd love to hear about your experience.
              </p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                <strong>How would you rate our service?</strong>
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 8px;">
                      <a href="${surveyBaseUrl}/5" style="display: block; width: 60px; height: 60px; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); border-radius: 10px; text-decoration: none; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); transition: transform 0.2s;">⭐</a>
                      <p style="margin: 8px 0 0 0; color: #16a34a; font-weight: bold; font-size: 12px;">Excellent</p>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="${surveyBaseUrl}/4" style="display: block; width: 60px; height: 60px; background: linear-gradient(135deg, #84cc16 0%, #a3e635 100%); border-radius: 10px; text-decoration: none; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);">⭐</a>
                      <p style="margin: 8px 0 0 0; color: #84cc16; font-weight: bold; font-size: 12px;">Good</p>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="${surveyBaseUrl}/3" style="display: block; width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 10px; text-decoration: none; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">⭐</a>
                      <p style="margin: 8px 0 0 0; color: #f59e0b; font-weight: bold; font-size: 12px;">OK</p>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="${surveyBaseUrl}/2" style="display: block; width: 60px; height: 60px; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); border-radius: 10px; text-decoration: none; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);">⭐</a>
                      <p style="margin: 8px 0 0 0; color: #f97316; font-weight: bold; font-size: 12px;">Poor</p>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="${surveyBaseUrl}/1" style="display: block; width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 10px; text-decoration: none; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">⭐</a>
                      <p style="margin: 8px 0 0 0; color: #dc2626; font-weight: bold; font-size: 12px;">Bad</p>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 14px; color: #64748b; text-align: center; margin: 24px 0;">
                Just click a star - it only takes 2 seconds!
              </p>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 32px 0;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #1e293b; font-weight: bold;">
                  Your feedback helps us:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
                  <li>Improve our service</li>
                  <li>Train our team</li>
                  <li>Help other customers find great service</li>
                </ul>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                Thank you for choosing Ample Removals!<br>
                <strong style="color: #6b21a8;">The Team</strong>
              </p>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
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
          console.log(`✅ Survey email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // Also SMS so it's unmissable.
        if (customer.phone) {
          const first = (customer.full_name || "there").split(" ")[0];
          await sendSMS(customer.phone, `Hi ${first}, how did Ample Removals do? A quick rating helps us a lot: ${surveyBaseUrl} - thank you! Ref ${booking.reference}`).catch(() => {});
        }

        // Mark survey as sent
        await supabase
          .from("bookings")
          .update({ survey_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "Post-move survey sent",
          metadata: { sent_to: customer.email },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} surveys, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent surveys to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("Survey cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
