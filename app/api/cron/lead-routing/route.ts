/**
 * GET /api/cron/lead-routing — score-based lead routing (no AI).
 *
 * Surfaces Hot/Warm leads that have had no action (no quote sent) within 15
 * minutes of enquiry, so the team can jump on them fast. Alerts the admin
 * (dashboard notification + push) with the recommended price. Deliberately does
 * NOT auto-send a priced quote without review — that's an explicit opt-in we can
 * wire to settings later; the routing/urgency value is delivered here safely.
 *
 * Idempotent via activity_log; intended to run every ~15 min (Supabase pg_cron).
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAdminPush } from "@/lib/push-dispatch";
import { formatCurrency } from "@/lib/utils";

const PRE_QUOTE = ["inquiry", "called", "not_called", "answered", "not_answered", "processing", "pending"];

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  // Hot/Warm leads, still pre-quote, older than 15 min, no quote sent.
  const { data: leads } = await supabase
    .from("bookings")
    .select("id, reference, lead_band, lead_score, quote_total, service_type, customer:customers(full_name)")
    .in("lead_band", ["hot", "warm"])
    .in("status", PRE_QUOTE)
    .is("quote_sent_at", null)
    .lte("created_at", cutoff)
    .limit(100);

  let alerted = 0;
  for (const lead of leads ?? []) {
    // Skip if we've already alerted on this lead.
    const { data: prior } = await supabase
      .from("activity_log").select("id")
      .eq("booking_id", lead.id).eq("action", "Lead routing alert sent").limit(1).maybeSingle();
    if (prior) continue;

    const customer = Array.isArray(lead.customer) ? lead.customer[0] : lead.customer;
    const name = customer?.full_name ?? "New lead";
    const band = String(lead.lead_band).toUpperCase();
    const rec = lead.quote_total ? ` · est. ${formatCurrency(Number(lead.quote_total))}` : "";
    const title = `${band} lead needs a quote`;
    const body = `${name} (${lead.reference}) — score ${lead.lead_score ?? "—"}/100${rec}. No action in 15 min.`;

    try {
      await supabase.from("notifications").insert({ type: "lead_routing", title, description: body, booking_id: lead.id });
    } catch { /* table optional */ }
    await sendAdminPush({ title, body, data: { bookingId: lead.id } }).catch(() => {});

    await supabase.from("activity_log").insert({
      booking_id: lead.id, action: "Lead routing alert sent",
      metadata: { band: lead.lead_band, score: lead.lead_score }, performed_by: "system",
    });
    alerted++;
  }

  return NextResponse.json({ success: true, scanned: leads?.length ?? 0, alerted });
}
