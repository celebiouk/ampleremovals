import { NextRequest, NextResponse } from "next/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

const ADMIN_PHONE = "07344683477";

/**
 * POST /api/admin/alerts/new-booking
 * Sends instant notification to admin when new booking received
 * Called from booking submission routes
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingReference, customerName, customerPhone, serviceType } = body;

    if (!bookingReference || !customerName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const serviceDisplay = serviceType?.replace(/_/g, " ") || "New Service";

    // EMAIL
    const emailSubject = `🔔 New Booking: ${customerName} - ${bookingReference}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Booking!</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #1e293b; font-weight: bold; margin-bottom: 24px;">
            You have a new booking request!
          </p>

          <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: bold;">Customer:</td>
                <td style="padding: 8px 0; color: #15803d;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #15803d;"><a href="tel:${customerPhone}" style="color: #15803d;">${customerPhone}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: bold;">Service:</td>
                <td style="padding: 8px 0; color: #15803d;">${serviceDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: bold;">Reference:</td>
                <td style="padding: 8px 0; color: #15803d;">${bookingReference}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings" style="display: inline-block; background: #6b21a8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View in Dashboard
            </a>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; color: #78350f; font-size: 14px;">
              ⏰ <strong>Action Required:</strong> Call customer within 2 hours for best conversion rate!
            </p>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
            Received at: ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })} (UK time)
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
      console.log(`✅ New booking email sent`);
    } catch (emailErr) {
      console.error("New booking email failed:", emailErr);
    }

    // SMS
    const smsBody = `🔔 NEW BOOKING!\n\n${customerName}\n${serviceDisplay}\n${bookingReference}\n\nCall: ${customerPhone}\n\nView: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings`;

    try {
      await sendSMS(ADMIN_PHONE, smsBody);
      console.log(`✅ New booking SMS sent`);
    } catch (smsErr) {
      console.error("New booking SMS failed:", smsErr);
    }

    // WhatsApp
    const whatsappBody = `🔔 *NEW BOOKING!*\n\n*Customer:* ${customerName}\n*Service:* ${serviceDisplay}\n*Reference:* ${bookingReference}\n\n📞 Call: ${customerPhone}\n\n⏰ Call within 2 hours for best results!\n\nView dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings`;

    try {
      await sendWhatsApp(ADMIN_PHONE, whatsappBody);
      console.log(`✅ New booking WhatsApp sent`);
    } catch (whatsappErr) {
      console.error("New booking WhatsApp failed:", whatsappErr);
    }

    return NextResponse.json({
      success: true,
      message: "Admin notified of new booking",
    });
  } catch (error) {
    console.error("New booking alert error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
