/**
 * Review request — thanks the customer after a completed job and asks for a
 * Google review. Email + SMS + WhatsApp. Best-effort + idempotent (one per
 * booking, tracked via activity_log).
 */
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { SERVICE_LABELS, DEFAULT_GOOGLE_REVIEW_LINK, COMPANY_PHONE } from "@/lib/constants";
import type { ServiceType } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function sendReviewRequest(supabase: any, bookingId: string): Promise<void> {
  try {
    // Idempotency: only once per booking.
    const { data: already } = await supabase
      .from("activity_log").select("id")
      .eq("booking_id", bookingId).eq("action", "Review request sent")
      .limit(1).maybeSingle();
    if (already) return;

    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, service_type, customer:customers(full_name, email, phone)")
      .eq("id", bookingId).single();
    if (!booking) return;
    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    if (!customer) return;

    const { data: settings } = await supabase.from("settings").select("google_review_link, company_name").eq("id", 1).single();
    const reviewLink = settings?.google_review_link || DEFAULT_GOOGLE_REVIEW_LINK;
    const company = settings?.company_name || "Ample Removals";
    const first = (customer.full_name || "there").split(" ")[0];
    const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;

    if (customer.email) {
      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: `How did we do? Leave ${company} a quick review ⭐`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Thank you, ${first}! 🎉</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
            <p style="color:#1e293b;">Thanks for choosing ${company} for your ${serviceLabel.toLowerCase()}. We hope everything went smoothly!</p>
            <p style="color:#475569;line-height:1.6;">If you were happy with our service, a quick Google review would mean the world to us — and it helps other people find a removals team they can trust. It only takes a minute. 🙏</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${reviewLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 30px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;">⭐ Leave a Google Review</a>
            </div>
            <p style="color:#94a3b8;font-size:13px;text-align:center;">Booking ${booking.reference}</p>
            <p style="color:#64748b;font-size:13px;text-align:center;">Questions? Call us on <a href="tel:+443335772070" style="color:#6b21a8;">${COMPANY_PHONE}</a></p>
          </div>
        </div>`,
      }).catch(() => {});
    }
    if (customer.phone) {
      await sendSMS(customer.phone, `Hi ${first}, thanks for choosing ${company}! If you were happy with our service, we'd really appreciate a quick review: ${reviewLink} Questions? ${COMPANY_PHONE}`).catch(() => {});
      await sendWhatsApp(customer.phone, `Hi ${first}! 🎉\n\nThank you for choosing *${company}*. We hope your ${serviceLabel.toLowerCase()} went smoothly!\n\nIf you were happy with the service, a quick Google review would mean the world to us ⭐\n\n${reviewLink}\n\nThank you! 🙏`).catch(() => {});
    }

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Review request sent",
      metadata: { reviewLink },
      performed_by: "system",
    });
  } catch (e) {
    console.error("sendReviewRequest failed:", e);
  }
}
