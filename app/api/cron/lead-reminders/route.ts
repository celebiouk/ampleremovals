import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import { sendLeadInvite } from "@/lib/lead-invite";

export const runtime = "nodejs";

/** Reminder thresholds (hours since creation) for stages 1..5. After stage 5
 *  (5 days), the ladder stops — the lead stays in the New Lead list. */
const SCHEDULE_HOURS = [2, 7, 24, 72, 120];

/**
 * GET /api/cron/lead-reminders
 * Chases pending New Leads (is_partial_lead) that the customer hasn't completed,
 * sending the next due reminder (email + SMS + WhatsApp) at 2h / 7h / 24h / 72h /
 * 5 days after creation, then stopping. Runs frequently (see vercel.json).
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString();

  // Pending leads still within the chase window that haven't had all 5 reminders.
  const { data: leads, error } = await supabase
    .from("bookings")
    .select("id, created_at, lead_reminder_stage, customer:customers!inner(full_name, email, phone)")
    .eq("is_partial_lead", true)
    .lt("lead_reminder_stage", SCHEDULE_HOURS.length)
    .gte("created_at", sixDaysAgo)
    .limit(500);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const lead of leads ?? []) {
    const stage = lead.lead_reminder_stage ?? 0;
    const hoursSince = (Date.now() - new Date(lead.created_at).getTime()) / 3_600_000;
    // Not yet due for the next reminder.
    if (hoursSince < SCHEDULE_HOURS[stage]) continue;

    const token = generateQuoteConfirmToken(lead.id);
    if (!token) continue;
    const customer = Array.isArray(lead.customer) ? lead.customer[0] : lead.customer;
    if (!customer?.email || !customer?.phone) continue;

    await sendLeadInvite({
      firstName: (customer.full_name ?? "there").split(" ")[0],
      email: customer.email,
      phone: customer.phone,
      link: `${siteUrl}/complete/${lead.id}/${token}`,
      reminder: true,
    });

    await supabase
      .from("bookings")
      .update({ lead_reminder_stage: stage + 1, lead_last_reminder_at: new Date().toISOString() })
      .eq("id", lead.id);
    await supabase.from("activity_log").insert({
      booking_id: lead.id,
      action: `Lead reminder ${stage + 1}/5 sent`,
      metadata: { hours_since_created: Math.round(hoursSince) },
      performed_by: "system",
    });
    sent++;
  }

  return NextResponse.json({ success: true, processed: leads?.length ?? 0, sent });
}
