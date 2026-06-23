import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/three-day-reminder
 * Runs daily at 9:00 AM UK time
 * Sends helpful preparation email 3 days before move
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

    // Calculate date 3 days from now (in UK timezone)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const targetDate = threeDaysFromNow.toISOString().split("T")[0];

    console.log(`📅 Looking for moves on ${targetDate} (3 days from now)`);

    // Find bookings with move_date in 3 days
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        move_date,
        three_day_reminder_sent_at,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("move_date", targetDate)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .is("three_day_reminder_sent_at", null);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for 3-day reminder");
      return NextResponse.json({
        success: true,
        message: "No bookings needing reminders",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for 3-day reminder`);

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
        const emailSubject = `Your Move is in 3 Days! 📦 Final Preparations - ${booking.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b21a8; padding: 28px 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 26px;">📦 Your Move is in 3 Days!</h1>
              <p style="color: #e9d5ff; margin: 0; font-size: 16px;">${moveDate}</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                Your moving day is just around the corner! Here's everything you need to know to prepare:
              </p>

              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #15803d; font-size: 16px;">✅ 3-Day Preparation Checklist</p>
                <ul style="margin: 0; padding-left: 20px; color: #166534; line-height: 1.8;">
                  <li>Start packing non-essential items (books, decorations, seasonal items)</li>
                  <li>Label all boxes clearly with room names</li>
                  <li>Make a list of items going in the van vs. items you're taking yourself</li>
                  <li>Notify utility companies (gas, electric, water, internet)</li>
                  <li>Update your address with banks, DVLA, and subscriptions</li>
                  <li>Arrange parking permits if needed (for both addresses)</li>
                  <li>Defrost freezer and plan final grocery shopping</li>
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
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400e; font-size: 16px;">💡 Top Tips for a Smooth Move</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
                  <li><strong>Parking:</strong> Ensure there's clear parking access at both locations</li>
                  <li><strong>Fragile items:</strong> Mark boxes clearly and pack with extra padding</li>
                  <li><strong>Valuables:</strong> Keep important documents, jewelry, and cash with you</li>
                  <li><strong>Essentials box:</strong> Pack kettle, mugs, phone chargers, toiletries for first night</li>
                  <li><strong>Meter readings:</strong> Take photos of all meter readings on move day</li>
                </ul>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">📞 Need Help?</p>
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  If you have any questions or need to make changes, call us on:<br>
                  <a href="tel:03335772070" style="color: #6b21a8; font-weight: bold; font-size: 16px;">0333 577 2070</a>
                </p>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                We'll send you another reminder the day before your move with final details!
              </p>

              <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
                Looking forward to helping you move!<br>
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
          console.log(`✅ 3-day reminder email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `📦 Your move is in 3 DAYS (${moveDate})!\n\nStart packing non-essentials, notify utilities, arrange parking permits.\n\nNeed help? Call 03335772070\n\nRef: ${booking.reference}`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `📦 *Your Move is in 3 Days!*\n\n${moveDate}\n\n*Preparation Checklist:*\n✅ Pack non-essential items\n✅ Notify utilities\n✅ Update your address\n✅ Arrange parking permits\n✅ Label all boxes\n\nNeed help? Call *0333 577 2070*\n\nBooking: ${booking.reference}`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody, {
            name: "move_reminder_3_day",
            variables: { "1": customer.full_name.split(" ")[0], "2": moveDate, "3": booking.reference },
          });
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        // Mark as sent
        await supabase
          .from("bookings")
          .update({ three_day_reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "3-day pre-move reminder sent",
          metadata: { sent_to: customer.email },
          performed_by: "system",
        });

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} reminders, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent 3-day reminders to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("3-day reminder cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
