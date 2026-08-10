import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { moreItemsBlockHtml, moreItemsLine } from "@/lib/inventory-email";

/**
 * GET /api/cron/two-day-reminder — runs daily.
 * The middle of the 3-day warm-up run (D-3, D-2, D-1): a friendly "your move is
 * 2 days away, we're getting ready" note that also shows the customer their item
 * list and asks them to tell us if they've got more to move.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const targetDate = twoDaysFromNow.toISOString().split("T")[0];

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id, reference, service_type, move_date, inventory, two_day_reminder_sent_at,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("move_date", targetDate)
      .in("status", ["deposit_paid_job_confirmed", "processing", "pending"])
      .is("two_day_reminder_sent_at", null);

    if (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
    }
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, message: "No bookings needing reminders", count: 0 });
    }

    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const customer = (Array.isArray(booking.customer) ? booking.customer[0] : booking.customer) as { full_name: string; email: string; phone: string };
        const origin = (Array.isArray(booking.origin) ? booking.origin[0] : booking.origin) as { line_1: string; line_2?: string; city?: string; postcode: string } | null;
        const destination = (Array.isArray(booking.destination) ? booking.destination[0] : booking.destination) as { line_1: string; line_2?: string; city?: string; postcode: string } | null;
        const fmtAddr = (a: typeof origin) => a ? [a.line_1, a.line_2, a.city, a.postcode].filter(Boolean).join(", ") : "";
        const firstName = customer.full_name.split(" ")[0];
        const moveDate = new Date(booking.move_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b21a8; padding: 28px 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">👋 Your move is in 2 days</h1>
              <p style="color: #e9d5ff; margin: 0; font-size: 16px;">${moveDate}</p>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
              <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin: 16px 0;">
                Just a quick note so you know we're on it — your move is coming up on <strong>${moveDate}</strong> and our team is getting everything ready for you.
              </p>

              ${moreItemsBlockHtml(booking.inventory)}

              ${origin ? `<div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 6px 0; font-weight: bold; color: #1e40af;">📍 Your move</p>
                <p style="margin: 0; color: #334155; font-size: 14px;"><strong>From:</strong> ${fmtAddr(origin)}</p>
                ${destination ? `<p style="margin: 6px 0 0; color: #334155; font-size: 14px;"><strong>To:</strong> ${fmtAddr(destination)}</p>` : ""}
              </div>` : ""}

              <p style="font-size: 14px; color: #64748b; margin: 20px 0;">Any questions or changes? Call us on <a href="tel:03335772070" style="color: #6b21a8; font-weight: bold;">0333 577 2070</a>. We'll send your final details the day before.</p>
              <p style="font-size: 14px; color: #64748b;">See you soon,<br><strong style="color: #6b21a8;">The Ample Removals Team</strong></p>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Booking Reference: ${booking.reference}</p>
            </div>
          </div>`;

        try {
          await resend.emails.send({ from: resendFrom, to: customer.email, subject: `Your move is in 2 days 👋 — ${booking.reference}`, html: emailBody });
        } catch (e) { console.error("2-day reminder email failed:", e); }

        const smsBody = `👋 Hi ${firstName}, your Ample Removals move is in 2 DAYS (${moveDate}). ${moreItemsLine()}\n\nQuestions? Call 03335772070. Ref: ${booking.reference}`;
        try { await sendSMS(customer.phone, smsBody); } catch (e) { console.error("2-day reminder sms failed:", e); }

        const waBody = `👋 *Your move is in 2 days!*\n\nHi ${firstName}, your move is coming up on ${moveDate} and we're getting ready.\n\n${moreItemsLine()}\n\nQuestions? Call *0333 577 2070*\nBooking: ${booking.reference}`;
        try { await sendWhatsApp(customer.phone, waBody); } catch (e) { console.error("2-day reminder whatsapp failed:", e); }

        await supabase.from("bookings").update({ two_day_reminder_sent_at: new Date().toISOString() }).eq("id", booking.id);
        await supabase.from("activity_log").insert({
          booking_id: booking.id,
          action: "2-day pre-move reminder sent",
          metadata: { sent_to: customer.email },
          performed_by: "system",
        });
        return { id: booking.id, success: true };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ success: true, message: `Sent 2-day reminders to ${successful} customers`, count: bookings.length, successful });
  } catch (error) {
    console.error("2-day reminder cron error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
