/**
 * AnyVan rating request — sent 48h after an AnyVan job. Warm, names the Ample
 * Removals driver, and is clear it's from us (NOT pretending to be AnyVan). The
 * customer already rated the driver in AnyVan; we ask separately how our driver did,
 * and on 5★ invite them to a Google review. Idempotent + best-effort.
 */
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { resend, resendFrom } from "@/lib/resend";
import { COMPANY_PHONE } from "@/lib/constants";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ampleremovals.com";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function sendAnyVanRatingRequest(supabase: any, jobId: string): Promise<void> {
  try {
    const { data: job } = await supabase.from("anyvan_jobs").select("*").eq("id", jobId).single();
    if (!job || job.rating_request_sent) return;

    const driverFirst = (job.driver_name || "Our driver").split(" ")[0];
    const customerFirst = (job.customer_name || "there").split(" ")[0];
    const link = `${SITE}/anyvan-rate/${jobId}`;

    const smsBody =
      `Hi ${customerFirst}, ${driverFirst} picked up and delivered your items on behalf of AnyVan. ` +
      `${driverFirst} is a driver with Ample Removals - we'd love to know how they did. ` +
      `Rate here: ${link} Thank you! Questions? ${COMPANY_PHONE}`;

    if (job.phone) {
      await sendSMS(job.phone, smsBody).catch(() => {});
      await sendWhatsApp(
        job.phone,
        `Hi ${customerFirst}! ${driverFirst} picked up and delivered your items on behalf of AnyVan. ${driverFirst} is a driver with *Ample Removals* - how did they do?\n\nRate here: ${link}\n\nThank you! 🙏`,
      ).catch(() => {});
    }
    if (job.email) {
      await resend.emails.send({
        from: resendFrom,
        to: job.email,
        subject: `How did ${driverFirst} do? - Ample Removals`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">How did ${driverFirst} do?</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;text-align:center;">
            <p style="color:#475569;line-height:1.6;">Hi ${customerFirst}, ${driverFirst} picked up and delivered your items on behalf of AnyVan. ${driverFirst} is a driver with <strong>Ample Removals</strong> — we'd love to know how they did.</p>
            <div style="margin:22px 0;">
              <a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 30px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;">Rate ${driverFirst} ⭐</a>
            </div>
            <p style="color:#64748b;font-size:13px;">Questions? Call ${COMPANY_PHONE}</p>
          </div>
        </div>`,
      }).catch(() => {});
    }

    await supabase.from("anyvan_jobs").update({
      rating_request_sent: true,
      rating_request_sent_at: new Date().toISOString(),
    }).eq("id", jobId);
  } catch (e) {
    console.error("sendAnyVanRatingRequest failed:", e);
  }
}
