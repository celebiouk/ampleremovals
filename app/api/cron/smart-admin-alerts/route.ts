import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

const ADMIN_PHONE = "07344683477";

/**
 * GET /api/cron/smart-admin-alerts
 * Runs hourly - sends smart alerts to admin about important events
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
    const now = new Date();
    const alerts: string[] = [];

    // ALERT 1: Quotes expiring in 48 hours (admin should call)
    const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const { data: expiringQuotes } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        quote_sent_at,
        quote_expires_at,
        customer:customers!inner(full_name, phone, email)
      `)
      .not("quote_sent_at", "is", null)
      .is("quote_confirmed_at", null)
      .lte("quote_expires_at", twoDaysFromNow.toISOString())
      .gte("quote_expires_at", now.toISOString())
      .is("quote_expiry_alert_sent", null);

    if (expiringQuotes && expiringQuotes.length > 0) {
      for (const quote of expiringQuotes) {
        const customer = Array.isArray(quote.customer) ? quote.customer[0] : quote.customer;
        const expiresIn = Math.round((new Date(quote.quote_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60));

        await sendAdminAlert(
          "⏰ Quote Expiring Soon",
          `Quote expires in ${expiresIn}hrs!\n\n${customer.full_name}\n${quote.reference}\n\nCall: ${customer.phone}\nSuggest: Call customer to follow up`,
          supabase
        );

        // Mark alert as sent
        await supabase
          .from("bookings")
          .update({ quote_expiry_alert_sent: true })
          .eq("id", quote.id);

        alerts.push(`Quote expiry: ${quote.reference}`);
      }
    }

    // ALERT 2: Move tomorrow but address not confirmed
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    const { data: unconfirmedMoves } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        move_date,
        address_confirmed,
        customer:customers!inner(full_name, phone, email)
      `)
      .eq("move_date", tomorrowDate)
      .eq("address_confirmed", false)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .is("address_unconfirmed_alert_sent", null);

    if (unconfirmedMoves && unconfirmedMoves.length > 0) {
      for (const move of unconfirmedMoves) {
        const customer = Array.isArray(move.customer) ? move.customer[0] : move.customer;

        await sendAdminAlert(
          "🚨 Address Not Confirmed",
          `Move TOMORROW but address not confirmed!\n\n${customer.full_name}\n${move.reference}\n\nCall: ${customer.phone}\nAction: Confirm addresses urgently`,
          supabase
        );

        // Mark alert as sent
        await supabase
          .from("bookings")
          .update({ address_unconfirmed_alert_sent: true })
          .eq("id", move.id);

        alerts.push(`Address unconfirmed: ${move.reference}`);
      }
    }

    // ALERT 3: Customer hasn't responded in 7 days (follow up needed)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: inactiveBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        status,
        created_at,
        customer:customers!inner(full_name, phone, email)
      `)
      .in("status", ["inquiry", "called", "not_called", "answered", "processing"])
      .lte("created_at", sevenDaysAgo.toISOString())
      .is("inactivity_alert_sent", null);

    if (inactiveBookings && inactiveBookings.length > 0) {
      for (const booking of inactiveBookings) {
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;

        await sendAdminAlert(
          "⚠️ No Response in 7 Days",
          `Customer inactive for 7 days!\n\n${customer.full_name}\n${booking.reference}\nStatus: ${booking.status}\n\nCall: ${customer.phone}\nAction: Follow up to re-engage`,
          supabase
        );

        // Mark alert as sent
        await supabase
          .from("bookings")
          .update({ inactivity_alert_sent: true })
          .eq("id", booking.id);

        alerts.push(`Inactive: ${booking.reference}`);
      }
    }

    // ALERT 4: Invoice overdue by 3+ days
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        due_date,
        amount,
        booking:bookings!inner(
          reference,
          customer:customers!inner(full_name, phone, email)
        )
      `)
      .eq("status", "sent")
      .lte("due_date", threeDaysAgo.toISOString().split("T")[0])
      .is("overdue_alert_sent", null);

    if (overdueInvoices && overdueInvoices.length > 0) {
      for (const invoice of overdueInvoices) {
        const booking = Array.isArray(invoice.booking) ? invoice.booking[0] : invoice.booking;
        const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
        const daysOverdue = Math.floor((now.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));

        await sendAdminAlert(
          "💰 Invoice Overdue",
          `Invoice ${daysOverdue} days overdue!\n\n${customer.full_name}\n${invoice.invoice_number}\n£${invoice.amount}\n\nCall: ${customer.phone}\nAction: Chase payment`,
          supabase
        );

        // Mark alert as sent
        await supabase
          .from("invoices")
          .update({ overdue_alert_sent: true })
          .eq("id", invoice.id);

        alerts.push(`Overdue invoice: ${invoice.invoice_number}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${alerts.length} admin alerts`,
      alerts,
    });
  } catch (error) {
    console.error("Smart admin alerts error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to send admin alert via all channels
async function sendAdminAlert(
  subject: string,
  message: string,
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${subject}</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <pre style="font-family: monospace; background: #f8fafc; padding: 20px; border-radius: 8px; white-space: pre-wrap; color: #1e293b;">${message}</pre>
        <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
          This is an automated alert from your Smart Admin System.
        </p>
      </div>
    </div>
  `;

  // Email
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
      to: resendAdminEmails,
      subject: `[ALERT] ${subject}`,
      html: emailBody,
    });
    console.log(`✅ Alert email sent: ${subject}`);
  } catch (emailErr) {
    console.error("Alert email failed:", emailErr);
  }

  // SMS
  try {
    await sendSMS(ADMIN_PHONE, `[ALERT] ${subject}\n\n${message}`);
    console.log(`✅ Alert SMS sent: ${subject}`);
  } catch (smsErr) {
    console.error("Alert SMS failed:", smsErr);
  }

  // WhatsApp
  try {
    await sendWhatsApp(ADMIN_PHONE, `*[ALERT]* ${subject}\n\n${message}`);
    console.log(`✅ Alert WhatsApp sent: ${subject}`);
  } catch (whatsappErr) {
    console.error("Alert WhatsApp failed:", whatsappErr);
  }

  // Log to server_logs
  await supabase.from("server_logs").insert({
    level: "info",
    message: `Admin alert sent: ${subject}`,
    metadata: { alert_type: subject, message },
  });
}
