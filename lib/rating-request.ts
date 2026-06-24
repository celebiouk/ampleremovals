/**
 * Rating request — fired the moment a job completes. Asks the customer to rate the
 * move (email star buttons + an SMS/WhatsApp link to the rating landing). The
 * survey flow then funnels 5★ → Google review and 1–4★ → private internal feedback.
 * Best-effort + idempotent (one per booking, tracked via activity_log).
 */
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { SERVICE_LABELS, COMPANY_PHONE } from "@/lib/constants";
import type { ServiceType } from "@/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ampleremovals.com";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function sendRatingRequest(supabase: any, bookingId: string): Promise<void> {
  try {
    const { data: already } = await supabase
      .from("activity_log").select("id")
      .eq("booking_id", bookingId).eq("action", "Rating request sent")
      .limit(1).maybeSingle();
    if (already) return;

    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, service_type, customer:customers(full_name, email, phone)")
      .eq("id", bookingId).single();
    if (!booking) return;
    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    if (!customer) return;

    const { data: settings } = await supabase.from("settings").select("company_name").eq("id", 1).single();
    const company = settings?.company_name || "Ample Removals";
    const first = (customer.full_name || "there").split(" ")[0];
    const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;
    const landing = `${SITE}/survey/${bookingId}`;
    const stars = [5, 4, 3, 2, 1]
      .map((n) => `<a href="${SITE}/survey/${bookingId}/${n}" style="text-decoration:none;font-size:34px;margin:0 3px;">⭐</a>`)
      .join("");

    if (customer.email) {
      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: `How was your move, ${first}? Rate ${company} ⭐`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Thanks for choosing ${company}!</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;text-align:center;">
            <p style="color:#475569;line-height:1.6;">We hope your ${serviceLabel.toLowerCase()} went smoothly. How did we do?</p>
            <div style="margin:20px 0;">${stars}</div>
            <p style="color:#94a3b8;font-size:13px;">Tap a star to rate us · Booking ${booking.reference}</p>
            <p style="color:#64748b;font-size:13px;">Questions? Call ${COMPANY_PHONE}</p>
          </div>
        </div>`,
      }).catch(() => {});
    }
    if (customer.phone) {
      await sendSMS(customer.phone, `Hi ${first}, thanks for choosing ${company}! How did we do? Rate us here: ${landing} Questions? ${COMPANY_PHONE}`).catch(() => {});
      // Free-text WhatsApp (delivers within the 24h window post-job); no template needed.
      await sendWhatsApp(customer.phone, `Hi ${first}! 🌟 Thanks for choosing *${company}*. How did your ${serviceLabel.toLowerCase()} go? Tap to rate us:\n${landing}`).catch(() => {});
    }

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Rating request sent",
      metadata: { landing },
      performed_by: "system",
    });
  } catch (e) {
    console.error("sendRatingRequest failed:", e);
  }
}
