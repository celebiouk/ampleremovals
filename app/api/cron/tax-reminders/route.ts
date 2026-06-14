/**
 * GET /api/cron/tax-reminders — daily nag for the year-end tax tasks.
 *
 * Corporation tax: nags daily Jan 1–Apr 30 until the owner marks it done.
 * Confirmation statement: nags daily in the 30 days before its due date.
 * Each nag = email + SMS + WhatsApp + in-app notification (best-effort).
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom, resendAdminEmail } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { financialYearRange } from "@/lib/bookkeeping";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ampleremovals.com";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("financial_year_end, confirmation_statement_due, company_name, company_phone")
      .eq("id", 1)
      .single();

    const yearEnd = settings?.financial_year_end || "03-31";
    const phone = settings?.company_phone as string | undefined;
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const sent: string[] = [];

    // ── Corporation tax: Jan 1 – Apr 30 ──────────────────────────────────────
    if (month >= 1 && month <= 4) {
      const corpEndYear = now.getFullYear() - 1;
      const corp = financialYearRange(yearEnd, corpEndYear);
      const filingDue = `${corpEndYear + 1}-${yearEnd}`;
      const task = await ensurePendingTask(supabase, "corporation_tax", corp.label, filingDue);
      if (task) {
        await nag(supabase, phone, {
          title: "Corporation tax due",
          body: `File your corporation tax for the period ${corp.start} to ${corp.end}. Open the Year-End pack and mark it done to stop these reminders.`,
        });
        sent.push("corporation_tax");
      }
    }

    // ── Confirmation statement: 30 days before its due date ───────────────────
    const confDue = settings?.confirmation_statement_due as string | null;
    if (confDue) {
      const due = new Date(confDue);
      const windowStart = new Date(due);
      windowStart.setDate(windowStart.getDate() - 30);
      if (now >= windowStart && now <= due) {
        const label = `CS-${due.getFullYear()}`;
        const task = await ensurePendingTask(supabase, "confirmation_statement", label, confDue);
        if (task) {
          await nag(supabase, phone, {
            title: "Confirmation statement due",
            body: `Your Companies House confirmation statement is due by ${confDue}. File it, then mark it done to stop these reminders.`,
          });
          sent.push("confirmation_statement");
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** Ensure the task row exists; return it only if still pending (so a "done" task stops nagging). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePendingTask(supabase: any, taskType: string, label: string, due: string) {
  await supabase
    .from("tax_year_tasks")
    .upsert({ task_type: taskType, period_label: label, due_date: due }, { onConflict: "task_type,period_label", ignoreDuplicates: true });
  const { data } = await supabase
    .from("tax_year_tasks")
    .select("id, status")
    .eq("task_type", taskType)
    .eq("period_label", label)
    .single();
  return data && data.status !== "done" ? data : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function nag(supabase: any, phone: string | undefined, msg: { title: string; body: string }) {
  const link = `${SITE}/admin/bookkeeping/year-end`;
  // Email (best-effort)
  try {
    await resend.emails.send({
      from: resendFrom,
      to: resendAdminEmail,
      subject: `⏰ ${msg.title}`,
      html: `<p>${msg.body}</p><p><a href="${link}">Open Year-End Tax →</a></p>`,
    });
  } catch (e) { console.error("tax-reminder email failed", e); }
  // SMS + WhatsApp (best-effort)
  if (phone) {
    try { await sendSMS(phone, `${msg.title}: ${msg.body} ${link}`); } catch (e) { console.error("tax-reminder sms failed", e); }
    try { await sendWhatsApp(phone, `*${msg.title}*\n\n${msg.body}\n\n${link}`); } catch (e) { console.error("tax-reminder whatsapp failed", e); }
  }
  // In-app notification
  try {
    await supabase.from("notifications").insert({ title: msg.title, description: msg.body, booking_id: null, is_read: false });
  } catch (e) { console.error("tax-reminder notification failed", e); }
}
