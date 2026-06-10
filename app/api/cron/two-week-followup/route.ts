import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

/**
 * GET /api/cron/two-week-followup
 * Runs daily - sends follow-up email 2 weeks after job completion
 * Email sent from daniel@ampleremovals.com
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

    // Calculate date 14 days ago (in UK timezone)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const targetDate = twoWeeksAgo.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log(`📅 Looking for jobs completed on ${targetDate}`);

    // Find completed jobs from exactly 14 days ago
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        job_completed_at,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(city, postcode),
        destination:addresses!destination_address_id(city, postcode)
      `)
      .eq("status", "job_completed")
      .gte("job_completed_at", `${targetDate}T00:00:00Z`)
      .lte("job_completed_at", `${targetDate}T23:59:59Z`);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for 2-week follow-up");
      return NextResponse.json({
        success: true,
        message: "No bookings to follow up",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for 2-week follow-up`);

    // Send follow-up emails
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };
        const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination as { city?: string; postcode: string };

        const destinationArea = destination.city || destination.postcode;

        const emailSubject = `How are you settling in, ${customer.full_name}? 🏡`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🏡 How Are You Settling In?</h1>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                It's been about <strong>two weeks</strong> since we helped you move to ${destinationArea},
                and I wanted to personally reach out to see how you're settling in!
              </p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                Moving can be quite an adventure, and I hope everything is going smoothly in your new home.
                Have you unpacked most of your boxes? Found your favorite local spots yet?
              </p>

              <div style="background: #f8fafc; border-left: 4px solid #6b21a8; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b;">
                  <strong>We'd love to hear from you!</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                  If there's anything we could have done better during your move, or if you have any
                  questions about settling in, please don't hesitate to reach out. Your feedback helps
                  us improve our service for future customers.
                </p>
              </div>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                If you were happy with our service, we'd be incredibly grateful if you could share your
                experience with others. A quick Google review would mean the world to us and helps other
                families find reliable removal services.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="#" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  ⭐ Leave a Google Review
                </a>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                Wishing you all the best in your new home!
              </p>

              <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
                Warm regards,<br>
                <strong style="color: #6b21a8;">Daniel</strong><br>
                Ample Removals<br>
                <a href="mailto:daniel@ampleremovals.com" style="color: #6b21a8;">daniel@ampleremovals.com</a><br>
                <a href="tel:03335772070" style="color: #6b21a8;">0333 577 2070</a>
              </p>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
                Booking Reference: ${booking.reference}
              </p>
            </div>
          </div>
        `;

        try {
          await resend.emails.send({
            from: "Daniel - Ample Removals <daniel@ampleremovals.com>",
            to: customer.email,
            replyTo: "daniel@ampleremovals.com",
            subject: emailSubject,
            html: emailBody,
          });
          console.log(`✅ 2-week follow-up sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Follow-up email failed:`, emailErr);
        }

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "2-week follow-up email sent",
          metadata: { email_sent_to: customer.email },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} follow-ups, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent 2-week follow-up to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("2-week follow-up cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
