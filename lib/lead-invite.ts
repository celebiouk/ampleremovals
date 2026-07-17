import { sendEmail } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

export interface LeadInvite {
  firstName: string;
  email: string;
  phone: string;
  link: string;
}

/**
 * Sends the "we need a few more details" invite to a new lead across all three
 * channels (email + SMS + WhatsApp). Best-effort: each channel is independent and
 * a failure never throws — the lead is already saved.
 *
 * NOTE: For production WhatsApp outside a 24h session window, Meta requires an
 * approved template. We send free text here (Twilio falls back to it); add a
 * `lead_details_request` template and wire it in for guaranteed delivery.
 */
export async function sendLeadInvite({ firstName, email, phone, link }: LeadInvite) {
  const smsText =
    `Hi ${firstName}, we received your request for a quote from Ample Removals but need a few more details. ` +
    `Add them here to get your instant quote: ${link}\n\nThank you, Daniel`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Just a few more details</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1e293b;">Hi ${firstName},</p>
        <p style="font-size: 16px; color: #1e293b; margin: 16px 0;">
          We received your request for a quote, but we need a few more details to get you the best price.
          It only takes a couple of minutes.
        </p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${link}" style="background: #16a34a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
            Complete my quote
          </a>
        </p>
        <p style="font-size: 14px; color: #64748b;">Or paste this link into your browser:<br>
          <a href="${link}" style="color: #6b21a8;">${link}</a>
        </p>
        <p style="font-size: 15px; color: #1e293b; margin-top: 24px;">Thank you for choosing Ample Removals,<br>Daniel</p>
      </div>
    </div>`;

  const whatsappText =
    `Hi ${firstName}, thanks for your interest in Ample Removals! 🚚\n\n` +
    `We just need a few more details to get you an instant quote. Tap here:\n${link}\n\nThank you, Daniel`;

  await Promise.allSettled([
    sendEmail({ to: email, subject: "We need a few more details for your quote — Ample Removals", html: emailHtml }),
    sendSMS(phone, smsText),
    sendWhatsApp(phone, whatsappText),
  ]);
}
