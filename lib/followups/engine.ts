import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { sendAdminPush } from "@/lib/push-dispatch";
import { formatCurrency } from "@/lib/utils";
import { COMPANY_PHONE, DEFAULT_GOOGLE_REVIEW_LINK } from "@/lib/constants";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { QUOTE_FOLLOWUP_DAYS, DEPOSIT_FOLLOWUP_DAYS, type FollowupVars } from "@/lib/followups/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";
const MAX_DAY = 14;
const SMS_CUTOFF_DAY = 5;

/** Calendar-day offset from an anchor timestamp — 0 the day it was sent, 1 the
 * next calendar day, and so on. Deliberately date-based (not 24h-based) so a
 * quote sent at 11pm and one sent at 7am both start their drip the next
 * morning, not at inconsistent internal offsets. */
function dayNumberSince(anchorISO: string | null): number | null {
  if (!anchorISO) return null;
  const anchor = new Date(anchorISO);
  const anchorDate = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((today - anchorDate) / 86_400_000);
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function wrapEmail(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;">
    <div style="background:#6b21a8;padding:22px 28px;border-radius:12px 12px 0 0;">
      <p style="color:#fff;margin:0;font-size:19px;font-weight:bold;">${subject}</p>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
      ${bodyHtml}
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">Ample Removals · ${COMPANY_PHONE}</p>
    </div>
  </body></html>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function reviewLink(supabase: SupabaseAdmin): Promise<string> {
  try {
    const { data } = await supabase.from("settings").select("google_review_link").eq("id", 1).maybeSingle();
    return data?.google_review_link || DEFAULT_GOOGLE_REVIEW_LINK;
  } catch {
    return DEFAULT_GOOGLE_REVIEW_LINK;
  }
}

/** Flags a booking for human review after 14 days of silence — reuses the
 * existing (previously unused anywhere) is_flagged/flag_reason columns. */
async function flagForReview(supabase: SupabaseAdmin, bookingId: string, reference: string, reason: string): Promise<void> {
  await supabase.from("bookings").update({ is_flagged: true, flag_reason: reason }).eq("id", bookingId);
  try {
    await supabase.from("notifications").insert({
      type: "followup_no_response",
      title: "No response after 14 days",
      description: `${reference}: ${reason}`,
      booking_id: bookingId,
    });
  } catch { /* best-effort */ }
  await sendAdminPush({
    title: "🟡 Needs a human look",
    body: `${reference} — ${reason}`,
    data: { bookingId },
  }).catch(() => {});
  try {
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Auto-flagged for review: ${reason}`,
      performed_by: "system",
    });
  } catch { /* best-effort */ }
}

interface QuoteCandidate {
  id: string; reference: string; quote_total: number | null; quote_sent_at: string | null;
  quote_followup_last_morning_sent_on: string | null; quote_followup_last_evening_sent_on: string | null;
  customer: { full_name: string; email: string; phone: string } | { full_name: string; email: string; phone: string }[] | null;
}

function oneCustomer<T>(c: T | T[] | null): T | null {
  return Array.isArray(c) ? (c[0] ?? null) : c;
}

async function quoteCandidates(supabase: SupabaseAdmin, slotColumn: "quote_followup_last_morning_sent_on" | "quote_followup_last_evening_sent_on") {
  // NULL (never sent) or before today — NOT `col = today` since that's NULL
  // (falsy) for never-sent rows and would wrongly exclude them.
  const { data } = await supabase
    .from("bookings")
    .select("id, reference, quote_total, quote_sent_at, quote_followup_last_morning_sent_on, quote_followup_last_evening_sent_on, customer:customers!inner(full_name, email, phone)")
    .eq("status", "quote_sent")
    .is("quote_confirmed_at", null)
    .eq("is_flagged", false)
    .or(`${slotColumn}.is.null,${slotColumn}.lt.${todayISODate()}`);
  return (data ?? []) as unknown as QuoteCandidate[];
}

function quoteVars(b: QuoteCandidate, customer: { full_name: string; email: string; phone: string }, review: string): FollowupVars {
  const token = generateQuoteConfirmToken(b.id);
  return {
    firstName: (customer.full_name || "there").split(" ")[0],
    total: formatCurrency(Number(b.quote_total ?? 0)),
    reference: b.reference,
    actionLink: token ? `${SITE_URL}/confirm-quote/${b.id}/${token}` : `${SITE_URL}/quote/${b.id}`,
    reviewLink: review,
    phone: COMPANY_PHONE,
  };
}

export async function runQuoteFollowupMorning(): Promise<{ sent: number; flagged: number }> {
  const supabase = createAdminClient();
  const candidates = await quoteCandidates(supabase, "quote_followup_last_morning_sent_on");
  const review = await reviewLink(supabase);
  let sent = 0, flagged = 0;

  for (const b of candidates) {
    const customer = oneCustomer(b.customer);
    if (!customer) continue;
    const day = dayNumberSince(b.quote_sent_at);
    if (day === null || day < 1) continue;
    if (day > MAX_DAY) {
      await flagForReview(supabase, b.id, b.reference, "No response 14 days after quote was sent");
      flagged++;
      continue;
    }
    const content = QUOTE_FOLLOWUP_DAYS[day];
    if (!content) continue;
    const v = quoteVars(b, customer, review);

    try {
      if (customer.email) await sendEmail({ to: customer.email, subject: content.emailSubject(v), html: wrapEmail(content.emailSubject(v), content.emailBody(v)) });
      if (customer.phone && day <= SMS_CUTOFF_DAY && content.sms) await sendSMS(customer.phone, content.sms(v));
    } catch { /* best-effort, still stamp so we don't retry-storm on a broken address */ }

    await supabase.from("bookings").update({ quote_followup_last_morning_sent_on: todayISODate() }).eq("id", b.id);
    sent++;
  }
  return { sent, flagged };
}

export async function runQuoteFollowupEvening(): Promise<{ sent: number }> {
  const supabase = createAdminClient();
  const candidates = await quoteCandidates(supabase, "quote_followup_last_evening_sent_on");
  const review = await reviewLink(supabase);
  let sent = 0;

  for (const b of candidates) {
    const customer = oneCustomer(b.customer);
    if (!customer?.phone) continue;
    const day = dayNumberSince(b.quote_sent_at);
    if (day === null || day < 1 || day > MAX_DAY) continue; // >14 already flagged by the morning run
    const content = QUOTE_FOLLOWUP_DAYS[day];
    if (!content) continue;
    const v = quoteVars(b, customer, review);

    try {
      await sendWhatsApp(customer.phone, content.whatsapp(v), undefined, { bookingId: b.id, title: `Quote follow-up — day ${day}` });
    } catch { /* best-effort */ }

    await supabase.from("bookings").update({ quote_followup_last_evening_sent_on: todayISODate() }).eq("id", b.id);
    sent++;
  }
  return { sent };
}

interface DepositCandidate {
  id: string; reference: string; deposit_followup_started_at: string | null;
  customer: { full_name: string; email: string; phone: string } | { full_name: string; email: string; phone: string }[] | null;
}

async function depositCandidates(supabase: SupabaseAdmin, slotColumn: "deposit_followup_last_morning_sent_on" | "deposit_followup_last_evening_sent_on") {
  const { data } = await supabase
    .from("bookings")
    .select("id, reference, deposit_followup_started_at, customer:customers!inner(full_name, email, phone)")
    .eq("status", "deposit_invoice_sent")
    .eq("is_flagged", false)
    .or(`${slotColumn}.is.null,${slotColumn}.lt.${todayISODate()}`);
  return (data ?? []) as unknown as DepositCandidate[];
}

/** The active (unpaid, uncancelled) deposit invoice for a booking — ensures it
 * has a pay_code, same lazy-generation pattern as invoices/send/route.ts. */
async function activeDepositInvoice(supabase: SupabaseAdmin, bookingId: string): Promise<{ invoice_number: string; total: number; payCode: string } | null> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, pay_code")
    .eq("booking_id", bookingId)
    .eq("type", "deposit")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!invoice) return null;

  let payCode = invoice.pay_code as string | null;
  if (!payCode) {
    for (let i = 0; i < 10; i++) {
      const candidate = randomBytes(5).toString("hex");
      const { data: clash } = await supabase.from("invoices").select("id").eq("pay_code", candidate).maybeSingle();
      if (!clash) { payCode = candidate; break; }
    }
    if (payCode) await supabase.from("invoices").update({ pay_code: payCode }).eq("id", invoice.id);
  }
  if (!payCode) return null;
  return { invoice_number: invoice.invoice_number, total: invoice.total, payCode };
}

function depositVars(invoice: { invoice_number: string; total: number; payCode: string }, customer: { full_name: string; email: string; phone: string }, review: string): FollowupVars {
  return {
    firstName: (customer.full_name || "there").split(" ")[0],
    total: formatCurrency(Number(invoice.total ?? 0)),
    reference: invoice.invoice_number,
    actionLink: `${SITE_URL}/pay/${invoice.payCode}`,
    reviewLink: review,
    phone: COMPANY_PHONE,
  };
}

export async function runDepositFollowupMorning(): Promise<{ sent: number; flagged: number }> {
  const supabase = createAdminClient();
  const candidates = await depositCandidates(supabase, "deposit_followup_last_morning_sent_on");
  const review = await reviewLink(supabase);
  let sent = 0, flagged = 0;

  for (const b of candidates) {
    const customer = oneCustomer(b.customer);
    if (!customer) continue;
    const day = dayNumberSince(b.deposit_followup_started_at);
    if (day === null || day < 1) continue;
    if (day > MAX_DAY) {
      await flagForReview(supabase, b.id, b.reference, "No deposit payment 14 days after invoice was sent");
      flagged++;
      continue;
    }
    const invoice = await activeDepositInvoice(supabase, b.id);
    if (!invoice) continue;
    const content = DEPOSIT_FOLLOWUP_DAYS[day];
    if (!content) continue;
    const v = depositVars(invoice, customer, review);

    try {
      if (customer.email) await sendEmail({ to: customer.email, subject: content.emailSubject(v), html: wrapEmail(content.emailSubject(v), content.emailBody(v)) });
      if (customer.phone && day <= SMS_CUTOFF_DAY && content.sms) await sendSMS(customer.phone, content.sms(v));
    } catch { /* best-effort */ }

    await supabase.from("bookings").update({ deposit_followup_last_morning_sent_on: todayISODate() }).eq("id", b.id);
    sent++;
  }
  return { sent, flagged };
}

export async function runDepositFollowupEvening(): Promise<{ sent: number }> {
  const supabase = createAdminClient();
  const candidates = await depositCandidates(supabase, "deposit_followup_last_evening_sent_on");
  const review = await reviewLink(supabase);
  let sent = 0;

  for (const b of candidates) {
    const customer = oneCustomer(b.customer);
    if (!customer?.phone) continue;
    const day = dayNumberSince(b.deposit_followup_started_at);
    if (day === null || day < 1 || day > MAX_DAY) continue;
    const invoice = await activeDepositInvoice(supabase, b.id);
    if (!invoice) continue;
    const content = DEPOSIT_FOLLOWUP_DAYS[day];
    if (!content) continue;
    const v = depositVars(invoice, customer, review);

    try {
      await sendWhatsApp(customer.phone, content.whatsapp(v), undefined, { bookingId: b.id, title: `Deposit follow-up — day ${day}` });
    } catch { /* best-effort */ }

    await supabase.from("bookings").update({ deposit_followup_last_evening_sent_on: todayISODate() }).eq("id", b.id);
    sent++;
  }
  return { sent };
}
