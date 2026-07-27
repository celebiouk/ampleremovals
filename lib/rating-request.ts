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
export interface RatingRequestOptions {
  /** "all" = email + SMS + WhatsApp (initial, on completion); "email" = email only
   *  (the daily reminders — we don't SMS/WhatsApp every single day). */
  channel?: "all" | "email";
}

export async function sendRatingRequest(
  supabase: any,
  bookingId: string,
  opts: RatingRequestOptions = {}
): Promise<void> {
  try {
    const channel = opts.channel ?? "all";

    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, service_type, survey_rating, survey_sent_at, survey_reminder_count, customer:customers(full_name, email, phone)")
      .eq("id", bookingId).single();
    if (!booking) return;
    if (booking.survey_rating != null) return;                 // already reviewed → stop
    const sentCount = Number(booking.survey_reminder_count ?? 0);
    if (sentCount >= 7) return;                                 // 7 days of nudges done
    // At most one nudge per ~day (also stops a re-complete double-send).
    if (booking.survey_sent_at && Date.now() - new Date(booking.survey_sent_at).getTime() < 20 * 3600 * 1000) return;
    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    if (!customer) return;

    const { data: settings } = await supabase.from("settings").select("company_name").eq("id", 1).single();
    const company = settings?.company_name || "Ample Removals";
    const first = (customer.full_name || "there").split(" ")[0];
    const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;
    const landing = `${SITE}/survey/${bookingId}`;
    // Numbered gold stars (1→5) so it's obvious which to tap — the number sits
    // inside each star. Ordered low→high; tapping the "5" star gives 5 stars.
    const stars = [1, 2, 3, 4, 5]
      .map(
        (n) => `<a href="${SITE}/survey/${bookingId}/${n}" style="text-decoration:none;display:inline-block;position:relative;width:48px;height:48px;margin:0 3px;vertical-align:middle;">
          <span style="font-size:48px;line-height:48px;color:#f59e0b;">&#9733;</span>
          <span style="position:absolute;top:0;left:0;width:48px;height:48px;line-height:48px;text-align:center;color:#ffffff;font-weight:bold;font-size:19px;">${n}</span>
        </a>`
      )
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
            <p style="color:#64748b;font-size:13px;">Tap the star with your rating — <strong>5 is the best!</strong></p>
            <p style="color:#94a3b8;font-size:12px;">Booking ${booking.reference}</p>
            <p style="color:#64748b;font-size:13px;">Questions? Call ${COMPANY_PHONE}</p>
          </div>
        </div>`,
      }).catch(() => {});
    }
    // SMS + WhatsApp only on the initial request — the daily reminders are email-only.
    if (channel === "all" && customer.phone) {
      await sendSMS(customer.phone, `Hi ${first}, thanks for choosing ${company}! How did we do? Rate us here: ${landing} Questions? ${COMPANY_PHONE}`).catch(() => {});
      // Free-text WhatsApp (delivers within the 24h window post-job); no template needed.
      await sendWhatsApp(customer.phone, `Hi ${first}! 🌟 Thanks for choosing *${company}*. How did your ${serviceLabel.toLowerCase()} go? Tap to rate us:\n${landing}`).catch(() => {});
    }

    await supabase.from("bookings").update({
      survey_sent_at: new Date().toISOString(),
      survey_reminder_count: sentCount + 1,
    }).eq("id", bookingId);
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: sentCount === 0 ? "Rating request sent" : `Review reminder ${sentCount + 1} sent`,
      metadata: { landing, channel },
      performed_by: "system",
    });
  } catch (e) {
    console.error("sendRatingRequest failed:", e);
  }
}
