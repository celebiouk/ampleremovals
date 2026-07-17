import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatCurrency } from "@/lib/utils";

const PHONE = "0333 577 2070";

/**
 * Moves a booking into "Quote Sent to Customer" once its instant quote exists,
 * records the transition, and kicks off the quote follow-up ladder (the same
 * fields the admin quote/send route uses). Best-effort on the follow-up columns
 * so it works even where those migrations aren't present.
 *
 * `supabase` is a service/admin client (RLS-bypassing) supplied by the caller.
 */
export async function markQuoteSent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  bookingId: string,
  previousStatus: string | null
): Promise<void> {
  const now = new Date().toISOString();

  // Core status change — must land.
  const { error } = await supabase
    .from("bookings")
    .update({ status: "quote_sent" })
    .eq("id", bookingId);
  if (error) {
    console.warn("markQuoteSent status update failed:", error.message);
    return;
  }

  // Follow-up ladder fields — best-effort (columns may not exist everywhere).
  try {
    await supabase
      .from("bookings")
      .update({ quote_sent_at: now, quote_confirmed_at: null, quote_followup_stage: 0, quote_last_followup_at: now })
      .eq("id", bookingId);
  } catch (e) {
    console.warn("markQuoteSent follow-up fields skipped:", e);
  }

  await Promise.allSettled([
    supabase.from("status_history").insert({
      booking_id: bookingId,
      previous_status: previousStatus,
      new_status: "quote_sent",
      changed_by: "system",
    }),
    supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Quote sent to customer",
      metadata: { channel: "instant_quote" },
      performed_by: "system",
    }),
  ]);
}

export interface ReserveMessageParams {
  bookingId: string;
  token: string;
  reference: string;
  firstName: string;
  email: string;
  phone: string;
  total: number;
}

/**
 * Sends the instant quote to the customer across email + SMS + WhatsApp, with a
 * "Reserve My Moving Date" link back to their quote page. Wording reassures that
 * reserving isn't final ("you can change your date later"). Best-effort — never
 * throws, so it can't break the booking.
 */
export async function sendReserveMessages({
  bookingId,
  token,
  reference,
  firstName,
  email,
  phone,
  total,
}: ReserveMessageParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${siteUrl}/quote/${bookingId}/${token}`;
  const amount = formatCurrency(total);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Your quote is ready 🎉</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin: 16px 0;">Here's your fixed-price quote for your move:</p>
        <div style="background: #f5f3ff; border-left: 4px solid #6b21a8; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 22px; font-weight: bold; color: #6b21a8;">${amount}</p>
        </div>
        <p style="font-size: 16px; margin: 16px 0;">Reserve your moving date to lock it in. <strong>Don't worry — you can change your date later</strong>, and you can review or tweak your quote first.</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${link}" style="background: #16a34a; color: #fff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
            Reserve My Moving Date
          </a>
        </p>
        <p style="font-size: 14px; color: #64748b;">Your quote is saved, so you can come back to this link any time:<br>
          <a href="${link}" style="color: #6b21a8;">${link}</a>
        </p>
        <p style="font-size: 15px; margin-top: 24px;">Any questions? Just call us on ${PHONE}.<br><br>Daniel<br>Ample Removals</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;

  const smsText =
    `Hi ${firstName}, your Ample Removals quote is ${amount}. Reserve your moving date (you can change it later): ${link} — Ref ${reference}`;

  const whatsappText =
    `Hi ${firstName}, your Ample Removals quote is *${amount}* 🚚\n\n` +
    `Reserve your moving date to lock it in — don't worry, you can change the date later:\n${link}\n\nRef: ${reference}`;

  await Promise.allSettled([
    resend.emails
      .send({ from: resendFrom, to: email, subject: `Your Ample Removals quote — reserve your moving date (${reference})`, html: emailHtml })
      .catch((e) => console.warn("reserve email failed:", e)),
    sendSMS(phone, smsText),
    sendWhatsApp(phone, whatsappText),
  ]);
}
