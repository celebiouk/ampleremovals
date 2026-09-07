import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatCurrency } from "@/lib/utils";
import { BANK_DETAILS, BANK_DETAILS_CONFIGURED } from "@/lib/deposit";
import { bookingItemsBlockHtml } from "@/lib/inventory-email";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveCrew } from "@/lib/crew";
import { loadPricing } from "@/lib/pricing";
import { generateQuotePDF } from "@/lib/pdf/generate-quote-pdf";
import { PREMIUM_INCLUDES, STANDARD_INCLUDES, premiumTotalFor } from "@/lib/tiers";
import type { QuotePDFData, QuoteLineItem } from "@/types";

/** Build the quote PDF + Standard/Premium figures for a booking. Best-effort:
 *  returns a null buffer if anything is missing so the email still sends. */
async function buildQuoteAssets(bookingId: string, standardTotal: number): Promise<{ pdf: Buffer | null; premiumTotal: number }> {
  try {
    const supabase = createAdminClient();
    const { data: b } = await supabase
      .from("bookings")
      .select(`reference, service_type, quote_line_items, quote_subtotal, quote_vat_rate, quote_vat_amount, quote_total, quote_valid_until, quote_notes,
        quote_crew_men, quote_van_count, quote_van_size, quote_crew_blurb,
        customer:customers(full_name, email, phone),
        origin_address:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination_address:addresses!destination_address_id(line_1, line_2, city, postcode)`)
      .eq("id", bookingId)
      .single();
    if (!b) return { pdf: null, premiumTotal: premiumTotalFor(standardTotal) };

    const { config } = await loadPricing(supabase);
    const premiumTotal = Math.round(standardTotal * config.premium_multiplier * 100) / 100;

    const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    const origin = Array.isArray(b.origin_address) ? b.origin_address[0] : b.origin_address;
    const dest = Array.isArray(b.destination_address) ? b.destination_address[0] : b.destination_address;
    const fmt = (a: typeof origin) => (a ? [a.line_1, a.line_2, a.city, a.postcode].filter(Boolean).join(", ") : "N/A");
    const crew = resolveCrew(b);
    const lines = (Array.isArray(b.quote_line_items) ? b.quote_line_items : []) as QuoteLineItem[];

    const pdfData: QuotePDFData = {
      quote_number: `QUOTE-${b.reference}`,
      customer_name: customer?.full_name ?? "",
      customer_email: customer?.email ?? "",
      customer_phone: customer?.phone ?? "",
      service_type: String(b.service_type).replace(/_/g, " ").toUpperCase(),
      origin_address: fmt(origin),
      destination_address: dest ? fmt(dest) : undefined,
      date: new Date().toLocaleDateString("en-GB"),
      valid_until: b.quote_valid_until || new Date(Date.now() + 7 * 864e5).toLocaleDateString("en-GB"),
      line_items: lines,
      subtotal: Number(b.quote_subtotal ?? standardTotal),
      vat_rate: Number(b.quote_vat_rate ?? 0),
      vat_amount: Number(b.quote_vat_amount ?? 0),
      total: Number(b.quote_total ?? standardTotal),
      notes: b.quote_notes || undefined,
      crew_line: crew.line,
      crew_blurb: crew.blurb,
      premium_total: premiumTotal,
      premium_includes: PREMIUM_INCLUDES,
    };
    const pdf = await generateQuotePDF(pdfData).catch(() => null);
    return { pdf, premiumTotal };
  } catch {
    return { pdf: null, premiumTotal: premiumTotalFor(standardTotal) };
  }
}

/** The "what you get" crew block for a booking's quote emails (default-filled). */
async function crewBlockHtml(bookingId: string): Promise<string> {
  let crew;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("bookings")
      .select("quote_crew_men, quote_van_count, quote_van_size, quote_crew_blurb")
      .eq("id", bookingId)
      .single();
    crew = resolveCrew(data ?? {});
  } catch {
    crew = resolveCrew({});
  }
  return `
    <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0 0 6px 0; font-size: 15px; color: #6b21a8;"><strong>What you get:</strong> ${crew.line}</p>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${crew.blurb}</p>
    </div>`;
}

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
  /** Customer's selected items — shown as a simple list in the email. */
  inventory?: unknown;
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
  inventory,
}: ReserveMessageParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${siteUrl}/quote/${bookingId}/${token}`;
  const standardAmount = formatCurrency(total);
  const crewHtml = await crewBlockHtml(bookingId);

  // Quote PDF + Premium figure (best-effort — email still goes without them).
  const { pdf, premiumTotal } = await buildQuoteAssets(bookingId, total);
  const premiumAmount = formatCurrency(premiumTotal);
  // Two one-click links that pre-select the tier and take the customer straight
  // to reserve + pay on their quote page.
  const standardLink = `${link}?tier=standard`;
  const premiumLink = `${link}?tier=premium`;

  const standardList = STANDARD_INCLUDES.map((f) => `<li>${f}</li>`).join("");
  const premiumList = PREMIUM_INCLUDES.slice(1).map((f) => `<li>${f}</li>`).join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Your quote is ready 🎉</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin: 16px 0;">Here's your fixed-price quote for your move — choose the package that suits you. Your full quote is attached as a PDF.</p>
        ${crewHtml}

        <!-- Standard: what you get INSIDE it -->
        <div style="border: 2px solid #6b21a8; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width:100%;"><tr>
            <td style="font-size: 16px; font-weight: bold; color: #6b21a8;">Standard Removal</td>
            <td style="text-align:right; font-size: 22px; font-weight: bold; color: #6b21a8;">${standardAmount}</td>
          </tr></table>
          <ul style="margin: 10px 0 0 0; padding-left: 18px; color: #475569; font-size: 13px; line-height: 1.7;">${standardList}</ul>
        </div>

        <!-- Premium: everything in Standard, plus… -->
        <div style="border: 2px solid #6b21a8; background:#faf5ff; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width:100%;"><tr>
            <td style="font-size: 16px; font-weight: bold; color: #6b21a8;">Premium — Full Pack &amp; Move</td>
            <td style="text-align:right; font-size: 22px; font-weight: bold; color: #6b21a8;">${premiumAmount}</td>
          </tr></table>
          <p style="margin: 8px 0 4px; font-size: 13px; font-weight: bold; color:#475569;">Everything in Standard, plus:</p>
          <ul style="margin: 0; padding-left: 18px; color: #475569; font-size: 13px; line-height: 1.7;">${premiumList}</ul>
        </div>

        ${bookingItemsBlockHtml(inventory)}

        <p style="font-size: 16px; margin: 20px 0 12px;">Ready to book? Pick your package — <strong>you can still change your date later</strong>:</p>
        <p style="text-align: center; margin: 0 0 12px;">
          <a href="${standardLink}" style="background: #16a34a; color: #fff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; width: 80%;">
            I'm booking Standard — ${standardAmount}
          </a>
        </p>
        <p style="text-align: center; margin: 0 0 24px;">
          <a href="${premiumLink}" style="background: #6b21a8; color: #fff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; width: 80%;">
            I'm booking Premium — ${premiumAmount}
          </a>
        </p>
        <p style="font-size: 14px; color: #64748b;">Or open your quote any time: <a href="${link}" style="color: #6b21a8;">${link}</a></p>
        <p style="font-size: 15px; margin-top: 24px;">Any questions? Just call us on ${PHONE}.<br><br>Daniel<br>Ample Removals</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;

  const smsText =
    `Hi ${firstName}, your Ample Removals quote: Standard ${standardAmount} or Premium ${premiumAmount}. Book your package (change your date later): ${link} — Ref ${reference}`;

  const whatsappText =
    `Hi ${firstName}, your Ample Removals quote is ready 🚚\n\n*Standard:* ${standardAmount}\n*Premium (full pack & move):* ${premiumAmount}\n\nPick your package to book (you can change the date later):\n${link}\n\nRef: ${reference}`;

  await Promise.allSettled([
    resend.emails
      .send({
        from: resendFrom,
        to: email,
        subject: `Your Ample Removals quote — Standard ${standardAmount} or Premium ${premiumAmount} (${reference})`,
        html: emailHtml,
        ...(pdf ? { attachments: [{ filename: `Quote-${reference}.pdf`, content: pdf }] } : {}),
      })
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
        <p style="font-size: 16px; margin: 16px 0;">To lock in your moving date, choose how you'd like to pay — all three options are on your booking page:</p>
        <div style="background: #f5f3ff; border-left: 4px solid #6b21a8; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px; font-size: 15px;">💳 <strong>Pay your ${amount} deposit by card</strong> — instant, reserves your date.</p>
          <p style="margin: 0 0 6px; font-size: 15px;">🅺 <strong>Pay in 3 with Klarna</strong> — split your whole move into 3 interest-free instalments.</p>
          <p style="margin: 0; font-size: 15px;">🏦 <strong>Pay your ${amount} deposit by bank transfer</strong> — no card fee:</p>
          ${bankRows}
        </div>
        <p style="font-size: 14px; color: #475569;">For bank transfer, use <strong>${reference}</strong> as the payment reference so we can match it, then tap "I've made the bank transfer" on your booking page. Card and Klarna are confirmed automatically.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${link}" style="background: #16a34a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
            Pay &amp; lock in my date
          </a>
        </p>
        <p style="font-size: 14px; color: #64748b;"><strong>Don't worry — you can still change your date later.</strong> Any questions? Call us on ${PHONE}.</p>
        <p style="font-size: 15px; margin-top: 16px;">Daniel<br>Ample Removals</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;

  const smsText =
    `Ample Removals: your date is reserved! Lock it in on your booking page — pay the ${amount} deposit by card or bank transfer, or spread your whole move over 3 with Klarna: ${link} (Ref ${reference}). You can still change your date later.`;

  const whatsappText =
    `Hi ${firstName}, your date is reserved! 🎉\n\nTo lock it in, choose how to pay on your booking page:\n\n💳 ${amount} deposit by card\n🅺 Pay in 3 with Klarna (whole move)\n🏦 ${amount} deposit by bank transfer\n\n${link}\n\nRef: ${reference}. Don't worry — you can still change your date later.`;

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
