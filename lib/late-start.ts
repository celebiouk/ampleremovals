/**
 * Late-to-START detection. On move day, a driver should be "on the way" to the
 * pickup by (scheduled pickup time − Office→pickup travel time). If they haven't
 * marked on the way by then, we proactively (and once) message the customer that
 * we're running behind. Runs every minute off the eta-engine cron.
 *
 * Office→pickup travel time is computed once per booking and cached
 * (office_to_pickup_seconds) so the per-minute check is just arithmetic.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { distanceMatrix } from "@/lib/google-maps";
import { geocodePostcode } from "@/lib/postcode";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { sendEmail } from "@/lib/resend";
import { ukToday, ukMinutesOfDay } from "@/lib/dates";

const CONFIRMED = ["deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid"];
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ampleremovals.com";
const PHONE = "0333 577 2070";

function hhmmToMin(hhmm: string): number {
  const [h, m] = String(hhmm).split(":").map((n) => parseInt(n, 10));
  return (h % 24) * 60 + (m || 0);
}

async function notifyLateStart(customer: { full_name?: string; email?: string | null; phone?: string | null }, reference: string, token?: string | null) {
  const first = (customer.full_name ?? "there").split(" ")[0];
  const link = token ? `${SITE}/track/${token}` : SITE;
  const html =
    `<p>Hi ${first},</p>` +
    `<p>A quick update on your move today — we're running a little behind schedule, so your driver is running late. We're sorry for the inconvenience.</p>` +
    `<p>They'll be on their way to you shortly, and we'll send you a live ETA the moment they set off.</p>` +
    `<p>Any questions, just call us on ${PHONE}. Job ref: ${reference}.</p><p><a href="${link}">Track your move</a></p>`;
  const sms = `Ample Removals: Hi ${first}, quick update — we're running a little behind for your move today, so your driver is running late. Sorry for the inconvenience! We'll send a live ETA as soon as they set off. Ref ${reference}. ${PHONE}`;
  const wa = `Hi ${first}, a quick update on your move today 🚚\n\nWe're running a little behind schedule and your driver is running late — we're sorry for the inconvenience. They'll be on the way to you shortly and we'll send a live ETA as soon as they set off.\n\nRef: ${reference}`;
  if (customer.email) await sendEmail({ to: customer.email, subject: "A quick update on your move today", html }).catch(() => {});
  if (customer.phone) {
    await sendSMS(customer.phone, sms).catch(() => {});
    await sendWhatsApp(customer.phone, wa).catch(() => {});
  }
}

export async function runDueLateStartChecks(supabase: any): Promise<{ lateAlerts: number }> {
  const today = ukToday();
  const nowMin = ukMinutesOfDay(new Date());

  // Today's confirmed jobs where the driver hasn't started the pickup journey and
  // we haven't already warned the customer. Only jobs with a scheduled time.
  const { data: jobs } = await supabase
    .from("bookings")
    .select("id, reference, move_time, office_to_pickup_seconds, live_tracking_token, customer:customers!inner(full_name, email, phone), origin:addresses!origin_address_id(postcode, lat, lng)")
    .eq("move_date", today)
    .in("status", CONFIRMED)
    .is("journey_started_at", null)
    .is("late_start_alert_sent_at", null)
    .not("move_time", "is", null);
  if (!jobs?.length) return { lateAlerts: 0 };

  const { data: settings } = await supabase.from("settings").select("office_postcode").eq("id", 1).maybeSingle();
  const officeGeo = await geocodePostcode(settings?.office_postcode || "RG18 3EB").catch(() => null);
  if (!officeGeo) return { lateAlerts: 0 };

  let sent = 0;
  for (const b of jobs) {
    const origin = Array.isArray(b.origin) ? b.origin[0] : b.origin;
    const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    const pickupDest = origin?.lat != null && origin?.lng != null ? `${origin.lat},${origin.lng}` : origin?.postcode;
    if (!pickupDest || !customer) continue;

    // Office→pickup travel time — compute once, then cache on the booking.
    let travelSec: number | null = b.office_to_pickup_seconds ?? null;
    if (travelSec == null) {
      const dm = await distanceMatrix(officeGeo.lat, officeGeo.lng, pickupDest).catch(() => null);
      travelSec = dm?.durationSeconds ?? null;
      if (travelSec != null) await supabase.from("bookings").update({ office_to_pickup_seconds: travelSec }).eq("id", b.id);
    }
    if (travelSec == null) continue;

    const latestStartMin = hhmmToMin(b.move_time) - Math.round(travelSec / 60);
    if (nowMin >= latestStartMin) {
      await notifyLateStart(customer, b.reference, b.live_tracking_token);
      await supabase.from("bookings").update({ late_start_alert_sent_at: new Date().toISOString() }).eq("id", b.id);
      await supabase.from("activity_log").insert({
        booking_id: b.id,
        action: `Customer alerted: driver late to start (pickup ${b.move_time}, ~${Math.round(travelSec / 60)} min away)`,
        performed_by: "system",
      });
      sent++;
    }
  }
  return { lateAlerts: sent };
}
