import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import crypto from "crypto";

/**
 * GET /api/cron/send-address-confirmations
 * Runs daily at 7:30 AM UK time
 * Sends address confirmation requests to customers whose move is TODAY
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

    // Get today's date in UK timezone (YYYY-MM-DD)
    const ukDate = new Date().toLocaleString("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).split("/").reverse().join("-");

    console.log(`📅 Checking for moves on ${ukDate}`);

    // Find bookings with move_date = today AND not already confirmed
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
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"]);

    if (error) {
      console.error("Fetch bookings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for today");
      return NextResponse.json({
        success: true,
        message: "No bookings for today",
        count: 0,
      });
    }

    console.log(`Found ${bookings.length} booking(s) for today`);

    // Send confirmation requests
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = booking.customer as { full_name: string; email: string; phone: string };
        const origin = booking.origin as { line_1: string; line_2?: string; city?: string; postcode: string } | null;
        const destination = booking.destination as { line_1: string; line_2?: string; city?: string; postcode: string } | null;

        // Generate secure token
        const token = crypto.randomBytes(32).toString("hex");

        // Update booking with token
        await supabase
          .from("bookings")
          .update({
            address_confirmation_token: token,
            address_confirmation_sent_at: new Date().toISOString(),
          })
          .eq("id", booking.id);

        const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/confirm-address/${booking.id}/${token}`;

        const formatAddress = (addr: typeof origin) => {
          if (!addr) return "Not provided";
          return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
        };

        const originAddress = formatAddress(origin);
        const destinationAddress = formatAddress(destination);

        // EMAIL
        const emailSubject = `🏠 Confirm Your Addresses - Moving Today! ${booking.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🏠 Confirm Your Addresses</h1>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">Hi ${customer.full_name},</p>

              <p style="font-size: 16px; color: #1e293b; margin-bottom: 24px;">
                <strong>Today is your moving day!</strong> 🚚
              </p>

              <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">
                Before we head out, please take a moment to confirm your addresses are correct:
              </p>

              <div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #15803d;">📍 Pick-up Address:</p>
                <p style="margin: 0; color: #334155;">${originAddress}</p>
              </div>

              <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">🏁 Delivery Address:</p>
                <p style="margin: 0; color: #334155;">${destinationAddress}</p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${confirmUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  ✅ Confirm Addresses
                </a>
              </div>

              <p style="font-size: 13px; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                If the addresses are incorrect, you can update them using the link above.
              </p>

              <p style="font-size: 13px; color: #64748b;">
                Booking Reference: <strong>${booking.reference}</strong>
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
          console.log(`✅ Email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error(`❌ Email failed:`, emailErr);
        }

        // SMS
        const smsBody = `🏠 MOVING TODAY!\n\nHi ${customer.full_name},\n\nPlease confirm your addresses:\n📍 From: ${originAddress}\n🏁 To: ${destinationAddress}\n\nConfirm here: ${confirmUrl}\n\nRef: ${booking.reference}`;

        try {
          await sendSMS(customer.phone, smsBody);
          console.log(`✅ SMS sent to ${customer.phone}`);
        } catch (smsErr) {
          console.error(`❌ SMS failed:`, smsErr);
        }

        // WhatsApp
        const whatsappBody = `🏠 *MOVING TODAY!*\n\nHi ${customer.full_name},\n\nPlease confirm your addresses:\n\n📍 *Pick-up:* ${originAddress}\n🏁 *Delivery:* ${destinationAddress}\n\nConfirm here: ${confirmUrl}\n\nBooking: ${booking.reference}`;

        try {
          await sendWhatsApp(customer.phone, whatsappBody, {
            name: "address_confirmation_request",
            variables: { "1": customer.full_name.split(" ")[0], "2": confirmUrl, "3": booking.reference },
          });
          console.log(`✅ WhatsApp sent to ${customer.phone}`);
        } catch (whatsappErr) {
          console.error(`❌ WhatsApp failed:`, whatsappErr);
        }

        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(`Processed ${bookings.length} bookings, ${successful} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent address confirmations to ${successful} customers`,
      count: bookings.length,
      successful,
    });
  } catch (error) {
    console.error("Address confirmation cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
