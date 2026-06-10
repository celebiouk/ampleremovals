import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/one-day-reminder
 * Runs daily at 9:30 AM UK time
 * Sends final preparation email 1 day before move
 * This runs AFTER address confirmation (7:30 AM) to include that status
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

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split("T")[0];

    console.log(`📅 Looking for moves on ${targetDate} (tomorrow)`);

    // Find bookings with move_date tomorrow
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        move_date,
        address_confirmed,
        one_day_reminder_sent_at,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("move_date", targetDate)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .is("one_day_reminder_sent_at", null);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for 1-day reminder");
      return NextResponse.json({
        success: true,
        message: "No bookings needing reminders",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for 1-day reminder`);

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
        const addressConfirmed = booking.address_confirmed;

        // EMAIL
        const emailSubject = `🚨 Moving Day Tomorrow! Final Checklist - ${booking.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">🚨 Moving Day Tomorrow!</h1>
              <p style="color: #fecaca; margin: 0; font-size: 18px; font-weight: bold;">Get Ready - We're Coming!</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 18px; color: #dc2626; font-weight: bold; margin: 20px 0;">
                Tomorrow is the big day! 🚚
              </p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                We're all set and excited to help you move. Here's your final checklist:
              </p>

              ${!addressConfirmed ? `
                <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 8px;">
                  <p style="margin: 0 0 12px 0; font-weight: bold; color: #991b1b; font-size: 16px;">⚠️ IMPORTANT: Confirm Your Addresses</p>
                  <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                    We sent you an address confirmation link this morning. Please confirm your addresses
                    as soon as possible so we know exactly where to go!
                  </p>
                </div>
              ` : `
                <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; color: #15803d; font-weight: bold;">✅ Addresses Confirmed - Thank You!</p>
                </div>
              `}

              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 16px 0; font-weight: bold; color: #92400e; font-size: 16px;">✅ Final Night Checklist</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.9;">
                  <li><strong>Pack an essentials box:</strong> Kettle, mugs, tea/coffee, phone chargers, toiletries</li>
                  <li><strong>Clear pathways:</strong> Remove obstacles from doorways and stairs</li>
                  <li><strong>Parking ready:</strong> Ensure clear parking access at both addresses</li>
                  <li><strong>Pets & kids:</strong> Arrange for them to be looked after during the move</li>
                  <li><strong>Meter readings:</strong> Take photos of all meters (gas, electric, water)</li>
                  <li><strong>Valuables:</strong> Keep important documents, jewelry, cash with you</li>
                  <li><strong>Final check:</strong> Walk through each room one last time</li>
                  <li><strong>Get good sleep:</strong> It's going to be an exciting day!</li>
                </ul>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">📍 Your Move Tomorrow:</p>
                <p style="margin: 8px 0 4px 0; color: #1e3a8a; font-size: 14px;"><strong>From:</strong></p>
                <p style="margin: 0 0 12px 0; color: #334155;">${originAddress}</p>
                <p style="margin: 8px 0 4px 0; color: #1e3a8a; font-size: 14px;"><strong>To:</strong></p>
                <p style="margin: 0; color: #334155;">${destinationAddress}</p>
              </div>

              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 10px; margin: 32px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #78350f; font-weight: bold;">📲 We'll Keep You Updated</p>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  You'll receive updates via email, SMS & WhatsApp as our driver:<br>
                  • Heads your way<br>
                  • Gets close to your location<br>
                  • Arrives at your new home
                </p>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">📞 Emergency Contact</p>
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  If anything comes up, call us anytime:<br>
                  <a href="tel:03335772070" style="color: #6b21a8; font-weight: bold; font-size: 18px;">0333 577 2070</a>
                </p>
              </div>

              <p style="font-size: 16px; color: #1e293b; margin-top: 32px; padding-top: 24px; border-top: 2px solid #e2e8f0; font-weight: bold;">
                See you tomorrow! 🎉
              </p>

              <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
                Best wishes,<br>
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
          console.log(`✅ 1-day reminder email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `🚨 MOVING DAY TOMORROW!\n\nFinal checklist: Pack essentials box, clear pathways, ensure parking access, take meter readings.\n\n${!addressConfirmed ? "⚠️ Don't forget to confirm your addresses!\n\n" : ""}We'll update you as our driver heads your way.\n\nCall us: 03335772070\nRef: ${booking.reference}`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `🚨 *MOVING DAY TOMORROW!*\n\nHi ${customer.full_name},\n\nWe're all set! Final checklist:\n\n✅ Pack essentials box\n✅ Clear pathways\n✅ Parking ready\n✅ Meter readings\n✅ Valuables with you\n✅ Get good sleep!\n\n${!addressConfirmed ? "⚠️ *Important:* Please confirm your addresses (check your email)\n\n" : ""}We'll keep you updated tomorrow!\n\nCall us: *0333 577 2070*\nBooking: ${booking.reference}`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody);
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        // Mark as sent
        await supabase
          .from("bookings")
          .update({ one_day_reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "1-day pre-move reminder sent",
          metadata: { sent_to: customer.email, address_confirmed: addressConfirmed },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} reminders, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent 1-day reminders to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("1-day reminder cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
