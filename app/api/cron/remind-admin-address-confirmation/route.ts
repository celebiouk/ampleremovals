import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

const ADMIN_PHONE = "03335772070";

/**
 * GET /api/cron/remind-admin-address-confirmation
 * Runs daily at 8:00 AM UK time
 * Reminds admin if customer hasn't confirmed addresses yet
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

    // Get today's date in UK timezone
    const ukDate = new Date().toLocaleString("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).split("/").reverse().join("-");

    console.log(`📅 Checking for unconfirmed moves on ${ukDate}`);

    // Find bookings with move_date = today AND confirmation sent BUT NOT confirmed yet
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("move_date", ukDate)
      .eq("address_confirmed", false)
      .not("address_confirmation_sent_at", "is", null)
      .is("address_admin_reminded_at", null); // Only send once

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No unconfirmed bookings found");
      return NextResponse.json({
        success: true,
        message: "All customers have confirmed",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} unconfirmed booking(s)`);

    // Send ONE combined notification to admin
    const bookingsList = bookings.map((b) => {
      const customer = b.customer as { full_name: string; email: string; phone: string };
      return `${customer.full_name} - ${b.reference} - ${customer.phone}`;
    }).join("\n");

    // EMAIL
    const emailSubject = `⚠️ ${bookings.length} Customer(s) Haven't Confirmed Addresses - Moving Today`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Address Confirmation Reminder</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">
            <strong>${bookings.length} customer(s)</strong> haven't confirmed their addresses yet, and they're moving TODAY!
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #991b1b;">📞 Please call to confirm addresses:</p>
            ${bookings.map(b => {
              const customer = b.customer as { full_name: string; email: string; phone: string };
              const origin = b.origin as { line_1: string; line_2?: string; city?: string; postcode: string } | null;
              const destination = b.destination as { line_1: string; line_2?: string; city?: string; postcode: string } | null;

              const formatAddress = (addr: typeof origin) => {
                if (!addr) return "Not provided";
                return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
              };

              return `
                <div style="margin: 16px 0; padding: 12px; background: white; border-radius: 6px;">
                  <p style="margin: 0; font-weight: bold; color: #1e293b;">${customer.full_name}</p>
                  <p style="margin: 4px 0; color: #64748b; font-size: 13px;">📞 <a href="tel:${customer.phone}">${customer.phone}</a></p>
                  <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Booking: ${b.reference}</p>
                  <p style="margin: 8px 0 4px 0; font-size: 12px; color: #15803d;">📍 From: ${formatAddress(origin)}</p>
                  <p style="margin: 4px 0; font-size: 12px; color: #1e40af;">🏁 To: ${formatAddress(destination)}</p>
                </div>
              `;
            }).join("")}
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            This is an automated reminder. If addresses are confirmed manually, update the booking status in the admin panel.
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
      console.log(`✅ Admin email sent`);
    } catch (emailErr) {
      console.error(`❌ Admin email failed:`, emailErr);
    }

    // SMS
    const smsBody = `⚠️ ${bookings.length} CUSTOMER(S) HAVEN'T CONFIRMED ADDRESSES - MOVING TODAY\n\n${bookingsList}\n\nPlease call to confirm!`;

    try {
      await sendSMS(ADMIN_PHONE, smsBody);
      console.log(`✅ Admin SMS sent`);
    } catch (smsErr) {
      console.error(`❌ Admin SMS failed:`, smsErr);
    }

    // WhatsApp
    const whatsappBody = `⚠️ *ADDRESS CONFIRMATION REMINDER*\n\n*${bookings.length} customer(s)* haven't confirmed addresses yet:\n\n${bookingsList}\n\n*Moving TODAY!* Please call to confirm.`;

    try {
      await sendWhatsApp(ADMIN_PHONE, whatsappBody);
      console.log(`✅ Admin WhatsApp sent`);
    } catch (whatsappErr) {
      console.error(`❌ Admin WhatsApp failed:`, whatsappErr);
    }

    // Mark as reminded
    await Promise.all(
      bookings.map((b) =>
        supabase
          .from("bookings")
          .update({ address_admin_reminded_at: new Date().toISOString() })
          .eq("id", b.id)
      )
    );

    return NextResponse.json({
      success: true,
      message: `Reminded admin about ${bookings.length} unconfirmed booking(s)`,
      count: bookings.length,
    });
  } catch (error) {
    console.error("Admin reminder cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
