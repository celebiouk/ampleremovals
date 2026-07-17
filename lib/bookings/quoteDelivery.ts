import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatCurrency } from "@/lib/utils";
import { BANK_DETAILS, BANK_DETAILS_CONFIGURED } from "@/lib/deposit";

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

export interface DepositMessageParams {
  bookingId: string;
  token: string;
  reference: string;
  firstName: string;
  email: string;
  phone: string;
  deposit: number;
}

/**
 * Sent when the customer reserves their date: the deposit request ("invoice")
 * with the amount, bank-transfer details and reference, across email + SMS +
 * WhatsApp — so they can pay even if they leave the browser. Best-effort.
 */
export async function sendDepositMessages({
  bookingId,
  token,
  reference,
  firstName,
  email,
  phone,
  deposit,
}: DepositMessageParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${siteUrl}/quote/${bookingId}/${token}`;
  const amount = formatCurrency(deposit);

  const bankRows = BANK_DETAILS_CONFIGURED
    ? `<table style="width:100%; font-size:15px; margin:8px 0;">
         <tr><td style="padding:6px 0; color:#64748b;">Account name</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${BANK_DETAILS.accountName}</td></tr>
         <tr><td style="padding:6px 0; color:#64748b;">Sort code</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${BANK_DETAILS.sortCode}</td></tr>
         <tr><td style="padding:6px 0; color:#64748b;">Account number</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${BANK_DETAILS.accountNumber}</td></tr>
         <tr><td style="padding:6px 0; color:#64748b;">Reference</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${reference}</td></tr>
       </table>`
    : `<p style="font-size:15px;">Please call us on ${PHONE} to pay your deposit.</p>`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">You've reserved your date 🎉</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin: 16px 0;">To lock in your moving date, please send your deposit of <strong>${amount}</strong> by bank transfer:</p>
        <div style="background: #f5f3ff; border-left: 4px solid #6b21a8; padding: 16px; margin: 16px 0; border-radius: 4px;">
          ${bankRows}
        </div>
        <p style="font-size: 14px; color: #475569;">Please use <strong>${reference}</strong> as the payment reference so we can match your transfer. Once you've paid, tap the button on your quote page to let us know.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${link}" style="background: #16a34a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
            View my booking
          </a>
        </p>
        <p style="font-size: 14px; color: #64748b;"><strong>Don't worry — you can still change your date later.</strong> Any questions? Call us on ${PHONE}.</p>
        <p style="font-size: 15px; margin-top: 16px;">Daniel<br>Ample Removals</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;

  const smsText =
    `Ample Removals: your date is reserved! Pay your ${amount} deposit by bank transfer to lock it in — details on your booking page: ${link} (Ref ${reference}). You can still change your date later.`;

  const bankLine = BANK_DETAILS_CONFIGURED
    ? `*${BANK_DETAILS.accountName}*\nSort code: ${BANK_DETAILS.sortCode}\nAccount: ${BANK_DETAILS.accountNumber}\nReference: ${reference}`
    : `Call us on ${PHONE} to pay.`;
  const whatsappText =
    `Hi ${firstName}, your date is reserved! 🎉\n\nTo lock it in, send your *${amount}* deposit by bank transfer:\n\n${bankLine}\n\n` +
    `Then tap "I've made the payment" on your booking page:\n${link}\n\nDon't worry — you can still change your date later.`;

  await Promise.allSettled([
    resend.emails
      .send({ from: resendFrom, to: email, subject: `Reserve confirmed — pay your deposit to lock in your date (${reference})`, html: emailHtml })
      .catch((e) => console.warn("deposit email failed:", e)),
    sendSMS(phone, smsText),
    sendWhatsApp(phone, whatsappText),
  ]);
}

export interface DepositConfirmedParams {
  reference: string;
  firstName: string;
  email: string;
  phone: string;
}

/**
 * Sent when the admin verifies the deposit landed: reassures the customer their
 * move is booked. Email + SMS + WhatsApp. Best-effort.
 */
export async function sendDepositConfirmedMessages({
  reference,
  firstName,
  email,
  phone,
}: DepositConfirmedParams): Promise<void> {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Your deposit is confirmed ✅</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin: 16px 0;">Great news — <strong>Ample Removals has confirmed your deposit</strong>, and your moving date is locked in. 🎉</p>
        <p style="font-size: 16px; margin: 16px 0;">We'll be in touch with the final details as your move approaches. <strong>Don't worry — you can still change your date if you need to</strong>; just give us a call.</p>
        <p style="font-size: 15px; margin-top: 16px;">Thank you for choosing us,<br>Daniel<br>Ample Removals · ${PHONE}</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;

  const smsText =
    `Ample Removals: your deposit is confirmed and your moving date is locked in! 🎉 We'll be in touch with the details. Questions? Call ${PHONE}. Ref ${reference}`;

  const whatsappText =
    `Hi ${firstName}, great news — *Ample Removals has confirmed your deposit* ✅\n\nYour moving date is locked in. We'll be in touch with the details soon. You can still change your date if you need to — just call us on ${PHONE}.\n\nRef: ${reference}`;

  await Promise.allSettled([
    resend.emails
      .send({ from: resendFrom, to: email, subject: `Your deposit is confirmed — your move is booked! (${reference})`, html: emailHtml })
      .catch((e) => console.warn("deposit-confirmed email failed:", e)),
    sendSMS(phone, smsText),
    sendWhatsApp(phone, whatsappText),
  ]);
}
