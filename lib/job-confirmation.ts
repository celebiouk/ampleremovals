/**
 * Job confirmation message — sent when a booking becomes "Job Confirmed"
 * (status deposit_paid_job_confirmed), whether via a manual status change or a
 * deposit being marked paid. Reassures the customer the booking is locked in and
 * there's nothing else for them to do right now.
 *
 * Email + SMS + WhatsApp (the owner's standard for customer comms). Best-effort:
 * never throws, so it can't block the status change.
 */

import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatDate } from "@/lib/utils";
import { SERVICE_LABELS } from "@/lib/constants";
import type { ServiceType } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function sendJobConfirmation(supabase: any, bookingId: string): Promise<void> {
  try {
    // Idempotency without a new column: the activity_log entry we write is the
    // marker, so a later status change (after a deposit already confirmed it)
    // won't re-send.
    const { data: already } = await supabase
      .from("activity_log")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("action", "Job confirmation sent to customer")
      .limit(1)
      .maybeSingle();
    if (already) return;

    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        reference, service_type, move_date, is_flexible_date, flexible_date_from, flexible_date_to,
        customer:customers(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, city, postcode),
        destination:addresses!destination_address_id(line_1, city, postcode)
      `)
      .eq("id", bookingId)
      .single();
    if (!booking) return;

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    if (!customer) return;

    const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin;
    const dest = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination;
    const fmtAddr = (a: { line_1?: string; city?: string; postcode?: string } | null) =>
      a ? [a.line_1, a.city, a.postcode].filter(Boolean).join(", ") : null;

    const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;
    const dateStr = booking.is_flexible_date && booking.flexible_date_from && booking.flexible_date_to
      ? `Flexible: ${formatDate(booking.flexible_date_from)} – ${formatDate(booking.flexible_date_to)}`
      : booking.move_date ? formatDate(booking.move_date) : "To be confirmed";
    const first = (customer.full_name || "there").split(" ")[0];

    const { data: settings } = await supabase.from("settings").select("company_phone").eq("id", 1).single();
    const phone = settings?.company_phone ?? "0333 577 2070";

    const detailsRows = [
      ["Booking reference", booking.reference],
      ["Service", serviceLabel],
      ["Date", dateStr],
      ...(fmtAddr(origin) ? [["Collection", fmtAddr(origin)!]] : []),
      ...(fmtAddr(dest) ? [["Delivery", fmtAddr(dest)!]] : []),
    ];

    const emailHtml = `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;"><tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,.08);">
          <tr><td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:30px;text-align:center;">
            <div style="font-size:42px;line-height:1;">✅</div>
            <h1 style="color:#fff;margin:10px 0 0;font-size:24px;">You're all booked in!</h1>
          </td></tr>
          <tr><td style="padding:30px;">
            <p style="font-size:16px;color:#0f172a;">Hi ${first},</p>
            <p style="font-size:15px;color:#475569;line-height:1.65;">
              Great news — your booking with Ample Removals is now <strong>fully confirmed</strong>.
              Everything is locked in and <strong>there's nothing else you need to do right now</strong>.
              Sit back and relax; we'll take care of the rest and be in touch as your date approaches.
            </p>
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:22px 0;background:#f8fafc;">
              <table style="width:100%;font-size:14px;color:#334155;">
                ${detailsRows.map(([l, v]) => `<tr><td style="padding:5px 0;color:#64748b;">${l}</td><td style="padding:5px 0;text-align:right;font-weight:bold;">${v}</td></tr>`).join("")}
              </table>
            </div>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;padding:14px 16px;margin:22px 0;">
              <p style="margin:0;font-size:14px;color:#166534;">
                <strong>What happens next?</strong><br/>
                We'll confirm your crew and timing closer to the day and send you a reminder. If anything
                changes your end, just let us know — otherwise you're set.
              </p>
            </div>
            <p style="font-size:14px;color:#475569;">Questions? Call us anytime on <strong>${phone}</strong>. We're happy to help.</p>
            <p style="font-size:14px;color:#475569;margin-top:24px;">Thank you for choosing us,<br/>The Ample Removals Team</p>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`;

    if (customer.email) {
      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: `Your booking is confirmed ✅ — ${booking.reference}`,
        html: emailHtml,
      }).catch(() => {});
    }
    if (customer.phone) {
      await sendSMS(customer.phone, `Ample Removals: Great news ${first}, your booking ${booking.reference} (${serviceLabel}, ${dateStr}) is CONFIRMED. Nothing else to do for now — we'll be in touch. Questions? ${phone}`).catch(() => {});
      await sendWhatsApp(customer.phone, `✅ *Booking Confirmed!*\n\nHi ${first}, your Ample Removals booking is all set:\n\n📋 *${booking.reference}*\n🚚 ${serviceLabel}\n📅 ${dateStr}\n\nThere's *nothing else you need to do* right now — we'll be in touch as your date approaches. Any questions, just call *${phone}*. 😊`).catch(() => {});
    }

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Job confirmation sent to customer",
      metadata: { reference: booking.reference },
      performed_by: "system",
    });
  } catch (e) {
    console.error("sendJobConfirmation failed:", e);
  }
}
