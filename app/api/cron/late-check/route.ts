/**
 * GET /api/cron/late-check — running-late detection (no AI).
 *
 * Compares each stop's planned target arrival (from today's route plans) against
 * the clock. If the driver is past target by > grace and hasn't arrived yet, the
 * customer gets a courteous "running a little behind" notice (once). Runs every
 * ~15 min via Supabase pg_cron.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { ukToday, ukMinutesOfDay } from "@/lib/dates";

const GRACE_MIN = 20;
const CONFIRMED = ["deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid"];

function hhmmToMin(hhmm: string): number {
  const [h, m] = String(hhmm).split(":").map((n) => parseInt(n, 10));
  return (h % 24) * 60 + (m || 0);
}

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = ukToday();
  const nowMin = ukMinutesOfDay(new Date());

  const { data: plans } = await supabase.from("route_plans").select("stops").eq("plan_date", today);
  // Map bookingId -> earliest target arrival minutes.
  const targets = new Map<string, number>();
  for (const p of plans ?? []) {
    for (const s of (p.stops ?? [])) {
      if (s.isBreak || !s.bookingId || s.bookingId === "break" || !s.targetArrival) continue;
      const t = hhmmToMin(s.targetArrival);
      if (!targets.has(s.bookingId) || t < targets.get(s.bookingId)!) targets.set(s.bookingId, t);
    }
  }
  if (targets.size === 0) return NextResponse.json({ success: true, notified: 0, reason: "no plans" });

  const ids = [...targets.keys()];
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, reference, status, arrived_at, customer:customers(full_name, email, phone)")
    .in("id", ids);

  const { data: settings } = await supabase.from("settings").select("company_phone").eq("id", 1).single();
  const phone = settings?.company_phone ?? "0333 577 2070";

  let notified = 0;
  for (const b of bookings ?? []) {
    if (b.arrived_at) continue;                              // already arrived
    if (!CONFIRMED.includes(b.status)) continue;             // not an active job
    const targetMin = targets.get(b.id)!;
    const lateBy = nowMin - targetMin;
    if (lateBy <= GRACE_MIN) continue;                       // not late enough

    const { data: prior } = await supabase
      .from("activity_log").select("id").eq("booking_id", b.id).eq("action", "Running late notice sent").limit(1).maybeSingle();
    if (prior) continue;

    const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    if (!customer) continue;
    const first = (customer.full_name ?? "there").split(" ")[0];
    const mins = Math.round(lateBy / 5) * 5; // round to nearest 5

    try {
      if (customer.email) {
        await resend.emails.send({
          from: resendFrom, to: customer.email,
          subject: `Quick update on your move — ${b.reference}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
            <p>Hi ${first},</p>
            <p>A quick heads-up — your Ample Removals driver is running approximately <strong>${mins} minutes behind schedule</strong>. We're sorry for the delay and will be with you as soon as we can.</p>
            <p>Thanks for your patience. Any questions, call us on <strong>${phone}</strong>.</p>
            <p style="color:#64748b;font-size:13px;">Job ref: ${b.reference}</p>
          </div>`,
        }).catch(() => {});
      }
      if (customer.phone) {
        await sendSMS(customer.phone, `Ample Removals: Sorry ${first}, your driver is running ~${mins} mins behind. We'll be with you as soon as we can. Job ${b.reference}. Questions? ${phone}`).catch(() => {});
        await sendWhatsApp(customer.phone, `Hi ${first}, quick update — your Ample Removals driver is running *~${mins} mins behind schedule*. Sorry for the delay, we'll be with you shortly! 🚚\n\nJob ${b.reference}`).catch(() => {});
      }
      await supabase.from("activity_log").insert({ booking_id: b.id, action: "Running late notice sent", metadata: { lateBy: mins }, performed_by: "system" });
      notified++;
    } catch (e) {
      console.error("late-check notify failed:", e);
    }
  }

  return NextResponse.json({ success: true, notified, scanned: bookings?.length ?? 0 });
}
