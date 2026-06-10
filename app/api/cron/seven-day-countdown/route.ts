import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/seven-day-countdown
 * Runs daily at 9:00 AM UK time
 * Sends countdown email 7 days before move
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

    // Calculate date 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const targetDate = sevenDaysFromNow.toISOString().split("T")[0];

    console.log(`📅 Looking for moves on ${targetDate} (7 days from now)`);

    // Find bookings with move_date in 7 days
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        move_date,
        seven_day_reminder_sent_at,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("move_date", targetDate)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .is("seven_day_reminder_sent_at", null);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for 7-day countdown");
      return NextResponse.json({
        success: true,
        message: "No countdown reminders to send",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for 7-day countdown`);

    // Send reminders
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };
        const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin as { line_1: string; line_2?: string; city?: string; postcode: string };
        const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination as { line_1: string; line_2?: string; city?: string; postcode: string };

        const formatAddress = (addr: typeof origin) => {
          return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
        };

        const originAddress = formatAddress(origin);
        const destinationAddress = formatAddress(destination);
        const moveDate = new Date(booking.move_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });

        // EMAIL
        const emailSubject = `Your move is 1 week away! 📅 Time to start preparing - ${booking.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">📅 Your Move is 1 Week Away!</h1>
              <p style="color: #e9d5ff; margin: 0; font-size: 16px;">${moveDate}</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                Your move is just <strong>7 days away</strong>! It's time to start preparing. Here's your week-by-week guide:
              </p>

              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #15803d; font-size: 16px;">📦 This Week (7 Days Out):</p>
                <ul style="margin: 0; padding-left: 20px; color: #166534; line-height: 1.8;">
                  <li>Start packing non-essential items (decorations, books, seasonal clothes)</li>
                  <li>Order packing materials if needed</li>
                  <li>Begin decluttering - donate/sell unwanted items</li>
                  <li>Create a moving folder for important documents</li>
                  <li>Notify your employer of your new address</li>
                </ul>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">📍 Your Move Details:</p>
                <p style="margin: 8px 0 4px 0; color: #1e3a8a; font-size: 14px;"><strong>From:</strong></p>
                <p style="margin: 0 0 12px 0; color: #334155;">${originAddress}</p>
                <p style="margin: 8px 0 4px 0; color: #1e3a8a; font-size: 14px;"><strong>To:</strong></p>
                <p style="margin: 0; color: #334155;">${destinationAddress}</p>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400e; font-size: 16px;">💡 Pro Tips for This Week:</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
                  <li><strong>Label Everything:</strong> Write room names on boxes clearly</li>
                  <li><strong>Take Photos:</strong> Document valuable items before packing</li>
                  <li><strong>Use What You Have:</strong> Pack clothes in suitcases, use towels as padding</li>
                  <li><strong>Keep Receipts:</strong> Some moving expenses may be tax-deductible</li>
                </ul>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b; font-weight: bold;">📅 What's Next?</p>
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  We'll send you reminders at:<br>
                  • 5 days before (organize utilities)<br>
                  • 3 days before (final packing)<br>
                  • 1 day before (last-minute checklist)
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="tel:03335772070" style="display: inline-block; background: #6b21a8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Questions? Call Us: 0333 577 2070
                </a>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                Excited to help you move!<br>
                <strong style="color: #6b21a8;">The Ample Removals Team</strong>
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
          console.log(`✅ 7-day countdown email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `📅 Your move is 1 WEEK AWAY (${moveDate})!\n\nThis week: Start packing non-essentials, order materials, declutter.\n\nWe'll send more reminders as moving day gets closer!\n\nRef: ${booking.reference}`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `📅 *Your Move is 1 Week Away!*\n\n${moveDate}\n\n*This Week's Tasks:*\n📦 Pack non-essentials\n🛒 Order packing materials\n🧹 Declutter & donate\n📁 Organize documents\n\nMore reminders coming as we get closer!\n\nQuestions? Call *0333 577 2070*\n\nBooking: ${booking.reference}`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody);
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        // Mark as sent
        await supabase
          .from("bookings")
          .update({ seven_day_reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "7-day countdown reminder sent",
          metadata: { sent_to: customer.email },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} countdowns, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent 7-day countdown to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("7-day countdown error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
