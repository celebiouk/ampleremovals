import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/three-month-followup
 * Runs daily - sends 20% discount offer 3 months after job completion
 * Email + SMS + WhatsApp
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

    // Calculate date 90 days ago (3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    const targetDate = threeMonthsAgo.toISOString().split("T")[0];

    console.log(`📅 Looking for jobs completed on ${targetDate}`);

    // Find completed jobs from exactly 90 days ago
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
      console.log("No bookings found for 3-month follow-up");
      return NextResponse.json({
        success: true,
        message: "No bookings to follow up",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for 3-month follow-up`);

    // Send follow-up notifications
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };

        // EMAIL
        const emailSubject = `${customer.full_name}, enjoy 20% off your next move! 🎁`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">🎁 Special Offer Inside!</h1>
              <p style="color: #e9d5ff; margin: 0; font-size: 16px;">Exclusive for our valued customers</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                Can you believe it's been <strong>3 months</strong> since we helped you move? Time flies!
              </p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                As one of our <strong>valued regular customers</strong>, we wanted to show our appreciation
                with an exclusive offer just for you.
              </p>

              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; padding: 28px; margin: 32px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 18px; color: #78350f; font-weight: bold;">
                  🎉 YOUR EXCLUSIVE DISCOUNT
                </p>
                <p style="margin: 0; font-size: 48px; font-weight: bold; color: #6b21a8; line-height: 1;">
                  20% OFF
                </p>
                <p style="margin: 8px 0 0 0; font-size: 16px; color: #92400e;">
                  Your Next Move or Furniture Delivery
                </p>
              </div>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 24px 0;">
                Whether you need to move more furniture, help a friend relocate, or need any of our services,
                we're here for you with this special discount.
              </p>

              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">📦 Our Services:</p>
                <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                  <li style="margin: 6px 0;">House Removals</li>
                  <li style="margin: 6px 0;">Man and Van</li>
                  <li style="margin: 6px 0;">House Clearance</li>
                  <li style="margin: 6px 0;">Furniture Delivery</li>
                  <li style="margin: 6px 0;">Office Moves</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="tel:03335772070" style="display: inline-block; background: #6b21a8; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(107, 33, 168, 0.3);">
                  📞 Call to Book Your Discount
                </a>
              </div>

              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 24px;">
                Or call us on <a href="tel:03335772070" style="color: #6b21a8; font-weight: bold;">0333 577 2070</a><br>
                and mention your booking reference: <strong>${booking.reference}</strong>
              </p>

              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 32px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #991b1b;">
                  <strong>⏰ Limited Time Offer:</strong> This exclusive 20% discount is valid for the next 30 days.
                </p>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                Thank you for being a valued customer. We look forward to helping you again soon!
              </p>

              <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
                Best regards,<br>
                <strong style="color: #6b21a8;">The Ample Removals Team</strong><br>
                <a href="mailto:hello@ampleremovals.com" style="color: #6b21a8;">hello@ampleremovals.com</a><br>
                <a href="tel:03335772070" style="color: #6b21a8;">0333 577 2070</a>
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
          console.log(`✅ 3-month follow-up email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `🎁 Hi ${customer.full_name}! It's been 3 months since your move. As our regular customer, enjoy 20% OFF your next move! Valid 30 days. Call 03335772070 & quote: ${booking.reference} - Ample Removals`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `🎁 *20% OFF for You!*\n\nHi ${customer.full_name}!\n\nIt's been 3 months since we helped you move, and we wanted to thank you with an exclusive offer:\n\n*20% OFF* your next move or furniture delivery! 🚚\n\n✅ Valid for 30 days\n✅ For our valued regular customers\n\nCall us on *0333 577 2070* and mention:\n*${booking.reference}*\n\nWe look forward to helping you again!\n\nAmple Removals Team`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody, {
            name: "loyalty_offer_3_month",
            variables: { "1": customer.full_name.split(" ")[0], "2": booking.reference },
          });
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "3-month follow-up with 20% discount offer sent",
          metadata: {
            email: customer.email,
            phone: customer.phone,
          },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} follow-ups, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent 3-month follow-up to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("3-month follow-up cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
