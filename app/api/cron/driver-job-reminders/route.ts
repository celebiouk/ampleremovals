/**
 * GET /api/cron/driver-job-reminders — evening-before reminder to each driver of
 * the jobs they have tomorrow, via Email + SMS + WhatsApp.
 *
 * Runs once daily (Vercel cron). Idempotent: each reminded booking gets an
 * activity_log marker so a re-run the same evening won't double-send.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { ukToday } from "@/lib/dates";
import { formatDate } from "@/lib/utils";
import { SERVICE_LABELS } from "@/lib/constants";
import type { ServiceType } from "@/types";

const ACTIVE = ["deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid", "pending", "processing"];

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const tomorrow = new Date(ukToday() + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  // Tomorrow's active jobs + assignments + customer + addresses.
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, reference, service_type, status,
      customer:customers(full_name),
      origin:addresses!origin_address_id(line_1, city, postcode),
      destination:addresses!destination_address_id(postcode),
      assignments:booking_driver_assignments(driver_id)
    `)
    .eq("move_date", dateStr)
    .in("status", ACTIVE)
    .limit(1000);

  // Group jobs by driver.
  type Job = { id: string; reference: string; service: string; customer: string; pickup: string; dropoff: string | null };
  const byDriver = new Map<string, Job[]>();
  for (const b of bookings ?? []) {
    const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    const o = Array.isArray(b.origin) ? b.origin[0] : b.origin;
    const d = Array.isArray(b.destination) ? b.destination[0] : b.destination;
    const job: Job = {
      id: b.id,
      reference: b.reference,
      service: SERVICE_LABELS[b.service_type as ServiceType] ?? b.service_type,
      customer: customer?.full_name ?? "Customer",
      pickup: o ? [o.line_1, o.city, o.postcode].filter(Boolean).join(", ") : "—",
      dropoff: d?.postcode ?? null,
    };
    for (const a of ((b.assignments ?? []) as { driver_id: string }[])) {
      if (!byDriver.has(a.driver_id)) byDriver.set(a.driver_id, []);
      byDriver.get(a.driver_id)!.push(job);
    }
  }
  if (byDriver.size === 0) return NextResponse.json({ success: true, reminded: 0 });

  const { data: settings } = await supabase.from("settings").select("company_phone").eq("id", 1).single();
  const phone = settings?.company_phone ?? "0333 577 2070";
  const niceDate = formatDate(dateStr);

  let reminded = 0;
  for (const [driverId, jobs] of byDriver) {
    // Idempotency: skip if we already reminded this driver for these jobs today.
    const { data: already } = await supabase
      .from("activity_log").select("id")
      .in("booking_id", jobs.map((j) => j.id))
      .eq("action", "Driver next-day reminder sent")
      .gte("created_at", new Date(Date.now() - 18 * 3600 * 1000).toISOString())
      .limit(1).maybeSingle();
    if (already) continue;

    const { data: driver } = await supabase
      .from("drivers").select("first_name, preferred_name, email, phone").eq("id", driverId).single();
    if (!driver) continue;
    const name = driver.preferred_name || driver.first_name || "there";
    const count = jobs.length;

    const listHtml = jobs.map((j, i) => `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:8px 0;">
        <p style="margin:0;font-weight:bold;color:#1e293b;">${i + 1}. ${j.service} — ${j.reference}</p>
        <p style="margin:4px 0 0;color:#475569;font-size:14px;">👤 ${j.customer}</p>
        <p style="margin:2px 0 0;color:#475569;font-size:14px;">📍 ${j.pickup}${j.dropoff ? ` → ${j.dropoff}` : ""}</p>
      </div>`).join("");

    try {
      if (driver.email) {
        await resend.emails.send({
          from: resendFrom, to: driver.email,
          subject: `Your ${count} job${count === 1 ? "" : "s"} tomorrow (${niceDate}) — Ample Removals`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#6b21a8;padding:22px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;">Tomorrow's Jobs 🚚</h1>
              <p style="color:#e9d5ff;margin:6px 0 0;font-size:14px;">${niceDate}</p>
            </div>
            <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:24px;">
              <p style="color:#1e293b;">Hi ${name}, here ${count === 1 ? "is your job" : `are your ${count} jobs`} for tomorrow:</p>
              ${listHtml}
              <p style="color:#64748b;font-size:13px;margin-top:16px;">Open the driver app for full details, addresses and live tracking. Questions? Call ${phone}.</p>
            </div>
          </div>`,
        }).catch(() => {});
      }
      if (driver.phone) {
        const first = jobs[0];
        await sendSMS(driver.phone, `Ample Removals: Hi ${name}, you have ${count} job${count === 1 ? "" : "s"} tomorrow (${niceDate}). First: ${first.reference} — ${first.pickup}. Full details in the driver app.`).catch(() => {});
        const waList = jobs.map((j, i) => `${i + 1}. *${j.reference}* — ${j.service}\n   👤 ${j.customer}\n   📍 ${j.pickup}${j.dropoff ? ` → ${j.dropoff}` : ""}`).join("\n\n");
        await sendWhatsApp(driver.phone, `🚚 *Tomorrow's Jobs* — ${niceDate}\n\nHi ${name}, you have *${count} job${count === 1 ? "" : "s"}* tomorrow:\n\n${waList}\n\nOpen the driver app for full details & live tracking. 📲`).catch(() => {});
      }

      // Mark each job reminded.
      await supabase.from("activity_log").insert(
        jobs.map((j) => ({ booking_id: j.id, action: "Driver next-day reminder sent", metadata: { driverId, date: dateStr }, performed_by: "system" })),
      );
      reminded++;
    } catch (e) {
      console.error("driver reminder failed:", e);
    }
  }

  return NextResponse.json({ success: true, reminded, jobsForDate: dateStr });
}
