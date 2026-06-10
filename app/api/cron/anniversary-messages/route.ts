import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/anniversary-messages
 * Runs daily at 10:00 AM UK time
 * Sends "Happy 1-year move anniversary" with special offer
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

    // Calculate date 1 year ago (365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const targetDate = oneYearAgo.toISOString().split("T")[0];

    console.log(`🎂 Looking for moves on ${targetDate} (1 year ago)`);

    // Find completed jobs from exactly 1 year ago
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        move_date,
        anniversary_email_sent_at,
        customer:customers!inner(id, full_name, email, phone, referral_code),
        destination:addresses!destination_address_id(city, postcode)
      `)
      .eq("status", "job_completed")
      .gte("move_date", `${targetDate}T00:00:00Z`)
      .lte("move_date", `${targetDate}T23:59:59Z`)
      .is("anniversary_email_sent_at", null);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No anniversaries today");
      return NextResponse.json({
        success: true,
        message: "No anniversaries to celebrate",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} anniversary/anniversaries`);

    // Send anniversary messages
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          referral_code: string;
        };
        const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination as { city?: string; postcode: string };

        const destinationArea = destination.city || destination.postcode;
        const referralLink = customer.referral_code
          ? `${process.env.NEXT_PUBLIC_SITE_URL}?ref=${customer.referral_code}`
          : null;

        // EMAIL
        const emailSubject = `🎂 Happy 1-Year Move Anniversary, ${customer.full_name}!`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 32px;">🎂 Happy Anniversary!</h1>
              <p style="color: #e9d5ff; margin: 0; font-size: 18px;">1 Year Since Your Move</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                Can you believe it's been <strong>one whole year</strong> since we helped you move to ${destinationArea}?
                Time flies when you're settling into a new home! 🏡
              </p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                We hope you've created wonderful memories in your home over the past year.
              </p>

              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; padding: 28px; margin: 32px 0; border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 18px; color: #78350f; font-weight: bold;">🎁 Anniversary Special</p>
                <p style="margin: 0; font-size: 48px; font-weight: bold; color: #6b21a8; line-height: 1;">15% OFF</p>
                <p style="margin: 8px 0 0 0; font-size: 16px; color: #92400e;">Your Next Move or Service</p>
              </div>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                Whether you're moving again, need furniture delivery, or know someone who could use our help,
                we're here with a special anniversary discount just for you!
              </p>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">📦 Our Services:</p>
                <ul style="margin: 0; padding-left: 20px; color: #64748b; line-height: 1.8;">
                  <li>House Removals</li>
                  <li>Man and Van</li>
                  <li>House Clearance</li>
                  <li>House Cleaning</li>
                  <li>End of Tenancy Cleaning</li>
                </ul>
              </div>

              ${referralLink ? `
                <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 4px;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af;">💝 Know Someone Moving?</p>
                  <p style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 14px;">
                    Share your referral link and you'll both get £20!
                  </p>
                  <div style="background: white; padding: 12px; border-radius: 6px; margin: 12px 0;">
                    <a href="${referralLink}" style="color: #6b21a8; word-break: break-all; font-size: 14px;">${referralLink}</a>
                  </div>
                  <p style="margin: 12px 0 0 0; font-size: 14px; color: #1e3a8a;">
                    <strong>Your Code:</strong> <span style="background: #fef3c7; padding: 4px 12px; border-radius: 4px; font-weight: bold; color: #6b21a8;">${customer.referral_code}</span>
                  </p>
                </div>
              ` : ""}

              <div style="text-align: center; margin: 32px 0;">
                <a href="tel:03335772070" style="display: inline-block; background: #6b21a8; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(107, 33, 168, 0.3);">
                  📞 Call to Book Your Discount
                </a>
              </div>

              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 24px;">
                Or call us on <a href="tel:03335772070" style="color: #6b21a8; font-weight: bold;">0333 577 2070</a><br>
                and mention: <strong>1-YEAR ANNIVERSARY</strong>
              </p>

              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 32px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #991b1b;">
                  <strong>⏰ Limited Time:</strong> This 15% anniversary discount is valid for 30 days.
                </p>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                Thank you for being a valued customer. Here's to many more years in your home! 🥂<br>
                <strong style="color: #6b21a8;">The Ample Removals Team</strong>
              </p>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
                Original Booking: ${booking.reference}
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
          console.log(`✅ Anniversary email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `🎂 Happy 1-year move anniversary, ${customer.full_name}! 🎉 Enjoy 15% OFF your next move or service. Valid 30 days. Call 03335772070 & mention: 1-YEAR ANNIVERSARY - Ample Removals`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `🎂 *Happy 1-Year Move Anniversary!*\n\nHi ${customer.full_name}!\n\nIt's been *one year* since we helped you move to ${destinationArea}! 🏡\n\n🎁 *Anniversary Special:*\n*15% OFF* your next move or service\n\nValid for 30 days!\n\nCall *0333 577 2070* and mention:\n*1-YEAR ANNIVERSARY*\n\n${referralLink ? `💝 *Refer a Friend:*\nYour code: *${customer.referral_code}*\nBoth get £20!\n\n` : ""}Cheers to more great years ahead! 🥂\n\nAmple Removals Team`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody);
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        // Mark as sent
        await supabase
          .from("bookings")
          .update({ anniversary_email_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "1-year anniversary message sent",
          metadata: { sent_to: customer.email },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} anniversaries, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent anniversary messages to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("Anniversary messages error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
