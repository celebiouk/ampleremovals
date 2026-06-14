import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatCurrency } from "@/lib/utils";

/**
 * GET /api/cron/quote-followup — runs hourly.
 *
 * Chases unconfirmed quotes with a 7-step reminder ladder. Each step is spaced
 * from the PREVIOUS reminder (cumulative gaps), not from the original send:
 *
 *   step 1: 2 hours after the quote was sent
 *   step 2: 24 hours after step 1
 *   step 3: 2 days  after step 2
 *   step 4: 3 days  after step 3
 *   step 5: 4 days  after step 4
 *   step 6: 5 days  after step 5
 *   step 7: 7 days  after step 6   (final)
 *
 * A booking is in the ladder only while `status = 'quote_sent'`. The moment the
 * customer confirms (status → 'quote_confirmed', quote_confirmed_at set) or the
 * admin moves the lead anywhere else, reminders stop automatically.
 *
 * `quote_followup_stage` (0–7) tracks progress; `quote_last_followup_at` is the
 * timestamp the next gap is measured from (the quote send for step 1, then each
 * reminder). At most one step advances per run.
 */

// Gap (in hours) from the previous reminder to each step.
const GAP_HOURS: Record<number, number> = {
  1: 2,
  2: 24,
  3: 2 * 24,
  4: 3 * 24,
  5: 4 * 24,
  6: 5 * 24,
  7: 7 * 24,
};
const FINAL_STAGE = 7;

export async function GET(req: Request) {
  try {
    if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = Date.now();

    // Every booking still awaiting quote confirmation that hasn't finished the ladder.
    const { data: candidates } = await supabase
      .from("bookings")
      .select(`
        id, reference, service_type, quote_total, quote_confirmation_token,
        quote_sent_at, quote_followup_stage, quote_last_followup_at,
        customer:customers!inner(full_name, email, phone)
      `)
      .eq("status", "quote_sent")
      .is("quote_confirmed_at", null)
      .lt("quote_followup_stage", FINAL_STAGE);

    let sent = 0;
    const breakdown: Record<number, number> = {};

    for (const booking of candidates ?? []) {
      const stage = booking.quote_followup_stage ?? 0;
      const nextStage = stage + 1;
      if (nextStage > FINAL_STAGE) continue;

      const anchor = new Date(booking.quote_last_followup_at ?? booking.quote_sent_at ?? 0).getTime();
      const dueAt = anchor + GAP_HOURS[nextStage] * 60 * 60 * 1000;
      if (now < dueAt) continue; // not yet time for this step

      const ok = await sendReminder(booking, nextStage, supabase);
      if (ok) {
        await supabase
          .from("bookings")
          .update({ quote_followup_stage: nextStage, quote_last_followup_at: new Date().toISOString() })
          .eq("id", booking.id);
        sent++;
        breakdown[nextStage] = (breakdown[nextStage] ?? 0) + 1;
      }
    }

    return NextResponse.json({ success: true, message: `Sent ${sent} quote reminders`, breakdown });
  } catch (error) {
    console.error("Quote follow-up cron error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/** Copy per ladder step — escalating warmth → urgency → final. */
const STEP_COPY: Record<number, { tag: string; heading: string; line: string; banner: string }> = {
  1: { tag: "2-hour check-in", heading: "Any questions about your quote?", line: "We sent your quote a little earlier — happy to help with anything before you decide.", banner: "#6b21a8" },
  2: { tag: "Day 1", heading: "Here's what's included", line: "Your price covers a professional, fully-insured team, all fuel and mileage, and careful loading & unloading — no hidden fees.", banner: "#2563eb" },
  3: { tag: "Still thinking it over?", heading: "We're holding your quote", line: "No rush — but your quote is ready whenever you are. Lock in your date with one tap.", banner: "#0d9488" },
  4: { tag: "A quick nudge", heading: "Ready to book your move?", line: "Dates fill up fast. Confirm now to secure the slot that works for you.", banner: "#7e22ce" },
  5: { tag: "We'd love to help", heading: "Your move, sorted", line: "If you're still comparing, we're confident on price and service. We'd be glad to take care of it for you.", banner: "#6b21a8" },
  6: { tag: "Expiring soon", heading: "Your quote is about to expire", line: "This is one of the last reminders before your quote closes. Confirm now to keep your price.", banner: "#ea580c" },
  7: { tag: "Final reminder", heading: "Last chance to confirm", line: "We haven't heard back, so this is our final reminder. If the timing's not right, no problem — we're here whenever you need us.", banner: "#dc2626" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendReminder(booking: any, stage: number, supabase: any): Promise<boolean> {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  if (!customer) return false;

  const copy = STEP_COPY[stage];
  const total = formatCurrency(Number(booking.quote_total ?? 0));
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/confirm-quote/${booking.id}/${booking.quote_confirmation_token}`;
  const finalNote = stage === FINAL_STAGE ? `<p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:24px;">This is our final reminder about this quote.</p>` : "";

  const emailSubject = `${copy.heading} — ${booking.reference}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background:${copy.banner};padding:24px;border-radius:12px 12px 0 0;">
        <p style="color:#e9d5ff;margin:0 0 4px;font-size:13px;letter-spacing:.5px;text-transform:uppercase;">${copy.tag}</p>
        <h1 style="color:#fff;margin:0;font-size:24px;">${copy.heading}</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#1e293b;">Hi ${customer.full_name},</p>
        <p style="font-size:16px;color:#1e293b;line-height:1.6;margin:16px 0;">${copy.line}</p>
        <div style="background:#f5f3ff;border-left:4px solid #6b21a8;padding:14px 16px;margin:20px 0;border-radius:4px;">
          <strong>Your quote:</strong> ${total} &nbsp;·&nbsp; Ref: ${booking.reference}
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${confirmUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">Confirm my quote</a>
          <p style="margin:12px 0 0;font-size:13px;color:#64748b;">or call us on 0333 577 2070</p>
        </div>
        ${finalNote}
      </div>
    </div>`;

  const smsBody = `Ample Removals: ${copy.heading} Your quote ${total} (ref ${booking.reference}). Confirm: ${confirmUrl} or call 0333 577 2070`;
  const whatsappBody = `Hi ${customer.full_name}! ${copy.line}\n\n💷 Quote: *${total}*\n📋 Ref: ${booking.reference}\n\nConfirm here: ${confirmUrl}\nOr call us: *0333 577 2070*`;

  try {
    if (customer.email) await resend.emails.send({ from: resendFrom, to: customer.email, subject: emailSubject, html: emailBody });
    if (customer.phone) await sendSMS(customer.phone, smsBody);
    if (customer.phone) await sendWhatsApp(customer.phone, whatsappBody);

    await supabase.from("activity_log").insert({
      booking_id: booking.id,
      action: `Quote reminder ${stage}/${FINAL_STAGE} sent`,
      metadata: { stage, total: booking.quote_total },
      performed_by: "system",
    });
    return true;
  } catch (err) {
    console.error(`Quote reminder stage ${stage} failed for ${booking.reference}:`, err);
    return false;
  }
}
