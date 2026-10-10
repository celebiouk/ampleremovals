import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatCurrency } from "@/lib/utils";
import { formatMoveTimeWindow } from "@/lib/dates";
import { BANK_DETAILS, BANK_DETAILS_CONFIGURED, depositFor, DEPOSIT_PERCENTAGE } from "@/lib/deposit";
import { bookingItemsBlockHtml } from "@/lib/inventory-email";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveCrew } from "@/lib/crew";
import { loadPricing } from "@/lib/pricing";
import { generateQuotePDF } from "@/lib/pdf/generate-quote-pdf";
import { PREMIUM_INCLUDES, STANDARD_INCLUDES, premiumTotalFor } from "@/lib/tiers";
import { HOURLY_RATE_TWO_MEN_VAN } from "@/lib/quote-engine";
import { shortenUrl } from "@/lib/short-links";
import type { QuotePDFData, QuoteLineItem } from "@/types";

/** Build the quote PDF + Standard/Premium figures for a booking. Best-effort:
 *  returns a null buffer if anything is missing so the email still sends. */
async function buildQuoteAssets(bookingId: string, standardTotal: number): Promise<{ pdf: Buffer | null; premiumTotal: number; depositPercentage: number }> {
  try {
    const supabase = createAdminClient();
    const { data: b } = await supabase
      .from("bookings")
      .select(`reference, service_type, quote_line_items, quote_subtotal, quote_vat_rate, quote_vat_amount, quote_total, quote_premium_total, quote_valid_until, quote_notes,
        quote_crew_men, quote_van_count, quote_van_size, quote_crew_blurb, deposit_percentage,
        customer:customers(full_name, email, phone),
        origin_address:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination_address:addresses!destination_address_id(line_1, line_2, city, postcode)`)
      .eq("id", bookingId)
      .single();
    if (!b) return { pdf: null, premiumTotal: premiumTotalFor(standardTotal), depositPercentage: DEPOSIT_PERCENTAGE };

    // Prefer an admin-set Premium price (e.g. from "fill it for them") over the
    // auto multiplier, so the email always matches what the customer will see.
    let premiumTotal = b.quote_premium_total != null ? Number(b.quote_premium_total) : null;
    if (premiumTotal == null) {
      const { config } = await loadPricing(supabase);
      premiumTotal = Math.round(standardTotal * config.premium_multiplier * 100) / 100;
    }

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
    return { pdf, premiumTotal, depositPercentage: Number(b.deposit_percentage) || DEPOSIT_PERCENTAGE };
  } catch {
    return { pdf: null, premiumTotal: premiumTotalFor(standardTotal), depositPercentage: DEPOSIT_PERCENTAGE };
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
  /** Which quote option(s) to actually tell the customer about. Any combination
   *  is valid, including showHourly alone with both the others off — the
   *  caller is responsible for not passing all three false (there'd be
   *  nothing to send). showStandard/showPremium default true (today's
   *  behaviour); showHourly defaults false. */
  showStandard?: boolean;
  showPremium?: boolean;
  showHourly?: boolean;
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
  showStandard = true,
  showPremium = true,
  showHourly = false,
}: ReserveMessageParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${siteUrl}/quote/${bookingId}/${token}`;
  const standardAmount = formatCurrency(total);
  const crewHtml = await crewBlockHtml(bookingId);

  // Quote PDF + Premium figure (best-effort — email still goes without them).
  const { pdf, premiumTotal, depositPercentage } = await buildQuoteAssets(bookingId, total);
  const premiumAmount = formatCurrency(premiumTotal);
  const standardDepositAmount = formatCurrency(depositFor(total, depositPercentage));
  const premiumDepositAmount = formatCurrency(depositFor(premiumTotal, depositPercentage));
  const hourlyRateText = `£${HOURLY_RATE_TWO_MEN_VAN}/hr`;
  // Two one-click links that pre-select the tier and take the customer straight
  // to reserve + pay on their quote page.
  const standardLink = `${link}?tier=standard`;
  const premiumLink = `${link}?tier=premium`;

  const standardList = STANDARD_INCLUDES.map((f) => `<li>${f}</li>`).join("");
  const premiumList = PREMIUM_INCLUDES.slice(1).map((f) => `<li>${f}</li>`).join("");

  const activeCount = [showStandard, showPremium, showHourly].filter(Boolean).length;
  const multiOption = activeCount > 1;

  // Quote cards — one block per active option. Multi-option mode labels each
  // card ("Standard Removal", "Premium…"); single-option mode drops the
  // tier name entirely ("Your Removal") since there's nothing to compare it to.
  const blocks: string[] = [];
  if (showStandard) {
    blocks.push(`
        <div style="border: 2px solid #6b21a8; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width:100%;"><tr>
            <td style="font-size: 16px; font-weight: bold; color: #6b21a8;">${multiOption ? "Standard Removal" : "Your Removal"}</td>
            <td style="text-align:right; font-size: 22px; font-weight: bold; color: #6b21a8;">${standardAmount}</td>
          </tr></table>
          <ul style="margin: 10px 0 0 0; padding-left: 18px; color: #475569; font-size: 13px; line-height: 1.7;">${standardList}</ul>
        </div>`);
  }
  if (showPremium) {
    blocks.push(`
        <div style="border: 2px solid #6b21a8; background:#faf5ff; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width:100%;"><tr>
            <td style="font-size: 16px; font-weight: bold; color: #6b21a8;">${multiOption ? "Premium — Full Pack & Move" : "Your Removal (Premium — Full Pack & Move)"}</td>
            <td style="text-align:right; font-size: 22px; font-weight: bold; color: #6b21a8;">${premiumAmount}</td>
          </tr></table>
          ${multiOption ? `<p style="margin: 8px 0 4px; font-size: 13px; font-weight: bold; color:#475569;">Everything in Standard, plus:</p>` : ""}
          <ul style="margin: 0; padding-left: 18px; color: #475569; font-size: 13px; line-height: 1.7;">${premiumList}</ul>
        </div>`);
  }
  if (showHourly) {
    blocks.push(`
        <div style="border: 2px solid #0f766e; background:#f0fdfa; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width:100%;"><tr>
            <td style="font-size: 16px; font-weight: bold; color: #0f766e;">Hourly Rate — 2 Men &amp; a Van</td>
            <td style="text-align:right; font-size: 22px; font-weight: bold; color: #0f766e;">${hourlyRateText}</td>
          </tr></table>
          <p style="margin: 8px 0 0; font-size: 13px; color: #475569;">Pay only for the time it takes — no fixed total. Call us to book at this rate.</p>
        </div>`);
  }
  const quoteBlockHtml = blocks.join("");

  // CTAs — a "Pay deposit" button per fixed-price option that's on; Hourly
  // never gets one (there's no total to deposit against), so if it's the
  // ONLY option, the CTA is a plain "call to book" instead of any button.
  const ctaButtons: string[] = [];
  if (showStandard) {
    ctaButtons.push(`
        <p style="text-align: center; margin: 0 0 12px;">
          <a href="${standardLink}" style="background: #16a34a; color: #fff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; width: 80%;">
            Pay ${standardDepositAmount} deposit${multiOption ? " — Standard" : " to secure your date"}
          </a>
        </p>`);
  }
  if (showPremium) {
    ctaButtons.push(`
        <p style="text-align: center; margin: 0 0 12px;">
          <a href="${premiumLink}" style="background: #6b21a8; color: #fff; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; width: 80%;">
            Pay ${premiumDepositAmount} deposit${multiOption ? " — Premium" : " to secure your date"}
          </a>
        </p>`);
  }
  const ctaHtml = ctaButtons.length > 0
    ? `<p style="font-size: 16px; margin: 20px 0 12px;">Ready to secure your date? A small deposit does it — <strong>the rest isn't due until moving day</strong>:</p>${ctaButtons.join("")}`
    : `<p style="font-size: 16px; margin: 20px 0 12px; text-align: center;"><strong>Ready to book at the hourly rate?</strong><br/>Call us on <a href="tel:${PHONE.replace(/\s/g, "")}" style="color: #0f766e;">${PHONE}</a> and we'll get your date locked in.</p>`;

  const introLine = showHourly && activeCount === 1
    ? "Here's your hourly rate for the move. Your full quote is attached as a PDF."
    : `Here's your quote${multiOption ? " — pick the option that suits you" : ""}. Your full quote is attached as a PDF.`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Your quote is ready 🎉</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin: 16px 0;">${introLine}</p>
        ${crewHtml}
        ${quoteBlockHtml}
        ${bookingItemsBlockHtml(inventory)}
        ${ctaHtml}
        <p style="font-size: 14px; color: #64748b;">Or open your quote any time: <a href="${link}" style="color: #6b21a8;">${link}</a></p>
        <p style="font-size: 15px; margin-top: 24px;">Any questions? Just call us on ${PHONE}.<br><br>Daniel<br>Ample Removals</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;

  // Plain-text option list reused by SMS/WhatsApp/subject, e.g. "Standard £500
  // or Premium £750" / "£75/hr (2 men & van)" / "Standard £500 or £75/hr".
  const parts: string[] = [];
  if (showStandard) parts.push(multiOption ? `Standard ${standardAmount}` : standardAmount);
  if (showPremium) parts.push(multiOption ? `Premium ${premiumAmount}` : premiumAmount);
  if (showHourly) parts.push(multiOption ? `${hourlyRateText}/hr (2 men & van)` : `${hourlyRateText} (2 men & van)`);
  const optionsText = parts.join(" or ");

  const smsLink = await shortenUrl(link);
  const smsCta = ctaButtons.length > 0
    ? `Pay a small deposit to secure your date (rest due on moving day): ${smsLink}`
    : `Call ${PHONE} to book: ${smsLink}`;
  const smsText = `Hi ${firstName}, your Ample Removals quote: ${optionsText}. ${smsCta} — Ref ${reference}`;

  const whatsappLines: string[] = [];
  if (showStandard) whatsappLines.push(`*${multiOption ? "Standard:" : "Your quote:"}* ${standardAmount} (deposit ${standardDepositAmount})`);
  if (showPremium) whatsappLines.push(`*${multiOption ? "Premium (full pack & move):" : "Your quote (full pack & move):"}* ${premiumAmount} (deposit ${premiumDepositAmount})`);
  if (showHourly) whatsappLines.push(`*Hourly rate (2 men & a van):* ${hourlyRateText} — call to book`);
  const whatsappCta = ctaButtons.length > 0
    ? `A small deposit secures your date — the rest isn't due until moving day:\n${link}`
    : `Call us on ${PHONE} to get your date locked in:\n${link}`;
  const whatsappText = `Hi ${firstName}, your Ample Removals quote is ready 🚚\n\n${whatsappLines.join("\n")}\n\n${whatsappCta}\n\nRef: ${reference}`;

  await Promise.allSettled([
    resend.emails
      .send({
        from: resendFrom,
        to: email,
        subject: `Your Ample Removals quote — ${optionsText} (${reference})`,
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

  const smsLink = await shortenUrl(link);
  const smsText =
    `Ample Removals: your date is reserved! Lock it in on your booking page — pay the ${amount} deposit by card or bank transfer, or spread your whole move over 3 with Klarna: ${smsLink} (Ref ${reference}). You can still change your date later.`;

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
  moveDate?: string | null;
  moveTime?: string | null;
  isFlexibleDate?: boolean;
}

/**
 * Sent when the admin verifies the deposit landed: reassures the customer their
 * move is booked. Email + SMS + WhatsApp. Best-effort.
 *
 * Includes the arrival window (same formatMoveTimeWindow default as every other
 * customer message) and a 48h-notice line for date changes — this was the one
 * message in the confirmed-booking trail that didn't carry the time.
 */
export async function sendDepositConfirmedMessages({
  reference,
  firstName,
  email,
  phone,
  moveDate,
  moveTime,
  isFlexibleDate,
}: DepositConfirmedParams): Promise<void> {
  const showWindow = Boolean(moveDate) && !isFlexibleDate;
  const windowStr = showWindow ? formatMoveTimeWindow(moveTime) : null;
  const changeNotice = "Need to change anything? Just call us at least 48 hours before your move date so we can rearrange the crew in time.";

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Your deposit is confirmed ✅</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px; margin: 16px 0;">Great news — <strong>Ample Removals has confirmed your deposit</strong>, and your moving date is locked in. 🎉</p>
        ${windowStr ? `
        <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 14px 18px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #15803d; font-weight: bold;">⏰ ARRIVAL WINDOW</p>
          <p style="margin: 4px 0 0; font-size: 20px; color: #14532d; font-weight: bold;">${windowStr}</p>
        </div>` : ""}
        <p style="font-size: 16px; margin: 16px 0;">We'll be in touch with the final details as your move approaches.</p>
        <p style="font-size: 14px; margin: 16px 0; color: #475569;"><strong>${changeNotice}</strong></p>
        <p style="font-size: 15px; margin-top: 16px;">Thank you for choosing us,<br>Daniel<br>Ample Removals · ${PHONE}</p>
        <p style="font-size: 13px; color: #94a3b8;">Ref: ${reference}</p>
      </div>
    </div>`;

  const smsText =
    `Ample Removals: your deposit is confirmed and your moving date is locked in${windowStr ? ` (arrival window ${windowStr})` : ""}! 🎉 Need to change anything? Call us at least 48hrs ahead. Questions? ${PHONE}. Ref ${reference}`;

  const whatsappText =
    `Hi ${firstName}, great news — *Ample Removals has confirmed your deposit* ✅\n\nYour moving date is locked in.${windowStr ? `\n⏰ Arrival window: ${windowStr}` : ""}\n\n${changeNotice}\n\nCall us on ${PHONE}.\n\nRef: ${reference}`;

  await Promise.allSettled([
    resend.emails
      .send({ from: resendFrom, to: email, subject: `Your deposit is confirmed — your move is booked! (${reference})`, html: emailHtml })
      .catch((e) => console.warn("deposit-confirmed email failed:", e)),
    sendSMS(phone, smsText),
    sendWhatsApp(phone, whatsappText),
  ]);
}
