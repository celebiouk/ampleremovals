import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatDate } from "@/lib/utils";

// Admin ALERT recipient — intentionally the company mobile (0333 landline numbers cannot receive SMS/WhatsApp). Public/customer-facing number is 0333 577 2070.
const ADMIN_PHONE = "07344683477";

/**
 * GET /api/cron/check-call-back-reminders
 * Cron job to check for due call back reminders and send notifications
 *
 * Vercel Cron: Set to run every hour
 */
export async function GET(req: Request) {
  try {
    // Verify cron secret (Vercel Cron sends this header)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Find due reminders (pending & datetime has passed)
    const { data: dueReminders, error } = await supabase
      .from("call_back_reminders")
      .select(`
        *,
        booking:bookings!inner(reference, service_type, move_date),
        customer:customers!inner(full_name, phone, email)
      `)
      .eq("status", "pending")
      .lte("reminder_datetime", now)
      .is("reminder_sent_at", null);

    if (error) {
      console.error("Fetch due reminders error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch reminders" },
        { status: 500 }
      );
    }

    if (!dueReminders || dueReminders.length === 0) {
      console.log("No due reminders found");
      return NextResponse.json({
        success: true,
        message: "No due reminders",
        count: 0,
      });
    }

    console.log(`Found ${dueReminders.length} due reminder(s)`);

    // Send notifications for each reminder
    const results = await Promise.allSettled(
      dueReminders.map(async (reminder) => {
        const booking = reminder.booking as { reference: string; service_type: string; move_date: string | null };
        const customer = reminder.customer as { full_name: string; phone: string; email: string };

        const moveDate = booking.move_date ? formatDate(booking.move_date) : "TBC";
        const reasonText = reminder.reason.replace(/_/g, " ");

        // Email notification
        const emailSubject = `⏰ Call Back Reminder: ${customer.full_name} — ${booking.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b21a8; padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">⏰ Call Back Reminder</h1>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e293b; margin-top: 0;">Time to call back:</h2>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">${customer.full_name}</p>
                <p style="margin: 4px 0 0 0; color: #78350f;">Booking: ${booking.reference}</p>
              </div>

              <table style="width: 100%; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Customer Phone:</td>
                  <td style="padding: 8px 0; font-weight: bold;"><a href="tel:${customer.phone}">${customer.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Service:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${booking.service_type.replace(/_/g, " ")}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Move Date:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${moveDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Reason:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${reasonText}</td>
                </tr>
              </table>

              ${reminder.notes ? `
                <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold; color: #334155;">Notes:</p>
                  <p style="margin: 8px 0 0 0; color: #475569;">${reminder.notes}</p>
                </div>
              ` : ""}

              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                This reminder was set to help you follow up with this customer at the right time.
              </p>
            </div>
          </div>
        `;

        try {
          // Send email to all admin emails
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
            to: resendAdminEmails,
            subject: emailSubject,
            html: emailBody,
          });
          console.log(`✅ Email sent for reminder ${reminder.id}`);
        } catch (emailErr) {
          console.error(`❌ Email failed for reminder ${reminder.id}:`, emailErr);
        }

        // SMS notification
        const smsBody = `⏰ CALL BACK REMINDER\n\n${customer.full_name} - ${booking.reference}\n📞 ${customer.phone}\n\nReason: ${reasonText}\nMove: ${moveDate}${reminder.notes ? `\n\nNotes: ${reminder.notes}` : ""}`;

        try {
          await sendSMS(ADMIN_PHONE, smsBody);
          console.log(`✅ SMS sent for reminder ${reminder.id}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed for reminder ${reminder.id}:`, smsErr);
        }

        // WhatsApp notification
        const whatsappBody = `⏰ *CALL BACK REMINDER*\n\n*${customer.full_name}*\nBooking: ${booking.reference}\n📞 ${customer.phone}\n\n*Service:* ${booking.service_type.replace(/_/g, " ")}\n*Move Date:* ${moveDate}\n*Reason:* ${reasonText}${reminder.notes ? `\n\n*Notes:* ${reminder.notes}` : ""}`;

        try {
          await sendWhatsApp(ADMIN_PHONE, whatsappBody);
          console.log(`✅ WhatsApp sent for reminder ${reminder.id}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed for reminder ${reminder.id}:`, whatsappErr);
        }

        // Mark reminder as sent
        await supabase
          .from("call_back_reminders")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", reminder.id);

        return { id: reminder.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${dueReminders.length} reminders, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Processed ${dueReminders.length} reminder(s)`,
      count: dueReminders.length,
      successful,
    });
  } catch (error) {
    console.error("Check reminders cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
