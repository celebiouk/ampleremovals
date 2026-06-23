import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

/**
 * GET /api/cron/five-day-countdown
 * Runs daily at 9:15 AM UK time
 * Sends utilities reminder 5 days before move
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

    // Calculate date 5 days from now
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const targetDate = fiveDaysFromNow.toISOString().split("T")[0];

    console.log(`📅 Looking for moves on ${targetDate} (5 days from now)`);

    // Find bookings with move_date in 5 days
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        move_date,
        five_day_reminder_sent_at,
        customer:customers!inner(full_name, email, phone)
      `)
      .eq("move_date", targetDate)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .is("five_day_reminder_sent_at", null);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for 5-day countdown");
      return NextResponse.json({
        success: true,
        message: "No countdown reminders to send",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for 5-day countdown`);

    // Send reminders
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };

        const moveDate = new Date(booking.move_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long"
        });

        // EMAIL
        const emailSubject = `5 days to go! ⚡ Time to notify utilities - ${booking.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">⚡ 5 Days to Go!</h1>
              <p style="color: #dbeafe; margin: 0; font-size: 16px;">Time to organize utilities</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>

              <p style="font-size: 18px; color: #2563eb; font-weight: bold; margin: 20px 0;">
                Your move is on ${moveDate} - that's just 5 days away!
              </p>

              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 20px 0;">
                This is the perfect time to notify utilities and update your address with important services.
              </p>

              <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af; font-size: 16px;">⚡ Utilities Checklist:</p>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; line-height: 1.9;">
                  <li><strong>Electricity:</strong> Notify your supplier of move date & final meter reading</li>
                  <li><strong>Gas:</strong> Update your gas provider with new address</li>
                  <li><strong>Water:</strong> Contact water company about property change</li>
                  <li><strong>Internet/Phone:</strong> Arrange transfer or new connection at new address</li>
                  <li><strong>TV License:</strong> Update your address online</li>
                  <li><strong>Council Tax:</strong> Notify both old and new councils</li>
                </ul>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400e; font-size: 16px;">📬 Update Your Address:</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.9;">
                  <li>Banks & credit cards</li>
                  <li>DVLA (driving license & vehicle registration)</li>
                  <li>GP, dentist, and other medical services</li>
                  <li>Insurance providers</li>
                  <li>Subscriptions (magazines, gym, etc.)</li>
                  <li>Employer & HMRC</li>
                  <li>Royal Mail redirection (optional but recommended)</li>
                </ul>
              </div>

              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #15803d; font-size: 14px;">
                  💡 <strong>Pro Tip:</strong> Take meter readings with photos on move day - saves disputes later!
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="tel:03335772070" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Need Help? Call: 0333 577 2070
                </a>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                We're here to help make your move smooth!<br>
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
          console.log(`✅ 5-day countdown email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `⚡ 5 DAYS TO GO (${moveDate})!\n\nToday: Notify utilities (gas, electric, water, internet) and update your address with banks, DVLA, GP.\n\nRef: ${booking.reference}`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `⚡ *5 Days to Go!*\n\nHi ${customer.full_name},\n\nMove day: ${moveDate}\n\n*Today's Tasks:*\n⚡ Notify utilities (gas, electric, water, internet)\n📬 Update address with banks, DVLA, GP\n📺 Update TV license & council tax\n📮 Consider Royal Mail redirection\n\n💡 Tip: Take meter reading photos on move day!\n\nBooking: ${booking.reference}`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody, {
            name: "move_reminder_5_day",
            variables: { "1": customer.full_name.split(" ")[0], "2": moveDate, "3": booking.reference },
          });
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        // Mark as sent
        await supabase
          .from("bookings")
          .update({ five_day_reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Log activity
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "5-day countdown reminder sent",
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
      message: `Sent 5-day countdown to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("5-day countdown error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
