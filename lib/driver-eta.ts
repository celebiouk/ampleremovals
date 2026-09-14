/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Smart-ETA orchestration (server-side brain of the hybrid engine).
 *
 * Call 1 runs synchronously when the driver taps "Start Journey" (instant ETA).
 * Calls 2-5 (30/20/10/5-min checkpoints) are fired by the 1-minute cron from
 * scheduled_callN_time, using the driver's last uploaded GPS. Arrival is
 * GPS-detected on the device and confirmed via recordArrived(). Every call is
 * written to journey_eta_log.
 *
 * STAGES (see below): each has a fire window [lowerFireSec, upperFireSec]. If the
 * live duration is above the window, retry after retryMs. If it's below the
 * window (driver's already closer than expected), the stage is skipped with no
 * message and the cascade immediately re-checks the NEXT stage against the same
 * data point — no wasted cron minute waiting for a stage that's already passed.
 *
 * STALE-GPS FALLBACK: a distance-matrix duration computed from a GPS fix that
 * hasn't moved in a while can get "stuck" (this is exactly what broke the old
 * 2-stage version in production — duration stayed ~constant call after call
 * because the driver's live position wasn't advancing, so it kept retrying
 * forever and no checkpoint ever fired). Rather than chase why the driver app's
 * background GPS sometimes stalls, each check first looks at how fresh the
 * driver's last GPS fix is (driver_locations.updated_at). If it's stale (>4 min
 * old), we don't trust a live recalculation — instead we fall back to a
 * wall-clock estimate: minutes remaining = call1_eta_timestamp − now (the ETA
 * captured back when the journey started). That number degrades gracefully
 * over the course of the journey and guarantees every checkpoint still fires
 * near the right time even if GPS never updates again.
 */

import { distanceMatrix } from "./google-maps";
import { notifyCustomer, notifyAdmin, type NotifyContext, type JourneyEvent } from "./driver-notify";
import { autoSendFullBalanceInvoice } from "./auto-full-invoice";

interface Stage {
  call: 2 | 3 | 4 | 5;
  type: "30min" | "20min" | "10min" | "5min";
  lowerFireSec: number; // below this, the driver's already closer — skip to the next stage
  upperFireSec: number; // above this, too early — retry
  retryMs: number;
  targetOffsetSec: number; // how many seconds before ETA this checkpoint targets (for scheduling the call)
}

const STAGES: Stage[] = [
  { call: 2, type: "30min", lowerFireSec: 1500, upperFireSec: 2100, retryMs: 5 * 60_000, targetOffsetSec: 1800 },
  { call: 3, type: "20min", lowerFireSec: 900, upperFireSec: 1320, retryMs: 5 * 60_000, targetOffsetSec: 1200 },
  { call: 4, type: "10min", lowerFireSec: 480, upperFireSec: 720, retryMs: 3 * 60_000, targetOffsetSec: 600 },
  { call: 5, type: "5min", lowerFireSec: 210, upperFireSec: 390, retryMs: 2 * 60_000, targetOffsetSec: 300 },
];

const GPS_STALE_MS = 4 * 60_000;

export type Leg = "pickup" | "delivery";

// Format in UK time — the server runs in UTC, so without this the ETA prints an
// hour behind during BST (e.g. a 12:55 ETA shows as "11:55", looking like the past).
const fmt = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
// We quote the customer an arrival WINDOW, not a single minute — the raw ETA plus
// a small buffer either side (parking, walking to the door, traffic wobble). e.g.
// a 1:00 ETA becomes "1:05–1:15".
const ARRIVAL_WINDOW_LOW_MIN = 5;
const ARRIVAL_WINDOW_HIGH_MIN = 15;
const fmtEta = (iso: string): string => {
  const base = Date.parse(iso);
  const lo = fmt(new Date(base + ARRIVAL_WINDOW_LOW_MIN * 60_000).toISOString());
  const hi = fmt(new Date(base + ARRIVAL_WINDOW_HIGH_MIN * 60_000).toISOString());
  return `${lo}–${hi}`;
};
const driverName = (d: any) => d?.preferred_name || d?.first_name || "Your driver";

async function loadBooking(supabase: any, bookingId: string) {
  const { data } = await supabase
    .from("bookings")
    .select(
      `*, customer:customers(full_name,email,phone),
       origin:addresses!origin_address_id(lat,lng,postcode),
       destination:addresses!destination_address_id(lat,lng,postcode)`
    )
    .eq("id", bookingId)
    .single();
  return data;
}

function legDest(booking: any, leg: Leg) {
  const a = leg === "pickup" ? booking.origin : booking.destination;
  const dest = a?.lat != null && a?.lng != null ? `${a.lat},${a.lng}` : a?.postcode ?? "";
  return { lat: a?.lat ?? null, lng: a?.lng ?? null, postcode: a?.postcode ?? "", dest };
}

function ctxOf(booking: any, leg: Leg, dName: string, dPhone: string | null, postcode: string, etaTime?: string): NotifyContext {
  return {
    customerName: booking.customer?.full_name ?? "Customer",
    customerEmail: booking.customer?.email ?? null,
    customerPhone: booking.customer?.phone ?? null,
    reference: booking.reference,
    driverName: dName,
    driverPhone: dPhone,
    leg,
    destinationPostcode: postcode,
    trackingToken: booking.live_tracking_token ?? null,
    etaTime,
  };
}

async function leadDriver(supabase: any, bookingId: string) {
  const { data } = await supabase
    .from("booking_driver_assignments")
    .select("driver_id, is_lead_driver, drivers(id, first_name, preferred_name, phone)")
    .eq("booking_id", bookingId)
    .order("is_lead_driver", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.drivers ?? null;
}

/** Fetch a driver's phone (auth.driver doesn't carry it). */
async function driverPhoneOf(supabase: any, driverId: string): Promise<string | null> {
  try {
    const { data } = await supabase.from("drivers").select("phone").eq("id", driverId).maybeSingle();
    return data?.phone ?? null;
  } catch { return null; }
}

async function driverGps(supabase: any, driverId: string) {
  const { data } = await supabase.from("driver_locations").select("lat,lng,updated_at").eq("driver_id", driverId).maybeSingle();
  return data;
}

function gpsIsFresh(gps: { updated_at?: string } | null): boolean {
  if (!gps?.updated_at) return false;
  return Date.now() - new Date(gps.updated_at).getTime() < GPS_STALE_MS;
}

async function logCall(
  supabase: any,
  row: {
    bookingId: string; driverId: string | null; leg: Leg; call: string;
    dLat: number; dLng: number; destLat: number | null; destLng: number | null;
    dur: number | null; eta: string | null; fired: boolean; type: JourneyEvent | null; nextAt: string | null;
  }
) {
  await supabase.from("journey_eta_log").insert({
    job_id: row.bookingId, driver_id: row.driverId, journey_leg: row.leg, call_number: row.call,
    driver_lat: row.dLat, driver_lng: row.dLng, destination_lat: row.destLat, destination_lng: row.destLng,
    duration_seconds_returned: row.dur, eta_timestamp_returned: row.eta,
    notification_fired: row.fired, notification_type: row.type, scheduled_next_call_at: row.nextAt,
  });
}

/** CALL 1 — fired synchronously when the driver taps Start Journey. */
export async function startJourneyCall1(
  supabase: any, bookingId: string, leg: Leg, driver: any, driverLat: number, driverLng: number
) {
  const booking = await loadBooking(supabase, bookingId);
  const dest = legDest(booking, leg);

  // Traffic-aware ETA is best-effort: if the Distance Matrix is unavailable
  // (e.g. GOOGLE_MAPS_API_KEY not set, quota, network) we still start the journey
  // and notify the customer — just without the precise minutes. Start Journey
  // must never be blocked by the ETA service.
  let dm: { durationSeconds: number; etaTimestamp: string } | null = null;
  try {
    dm = await distanceMatrix(driverLat, driverLng, dest.dest);
  } catch (e) {
    console.error("[eta] Call 1 ETA unavailable — starting journey without precise ETA", e);
  }

  const now = new Date();
  // Schedule the first checkpoint (30-min) only when we have a real ETA (every
  // stage needs the API). A short hop (< 30 min total) starts the cascade
  // already past stage 1 — processCall's skip-forward logic (see below) will
  // land on whichever stage actually applies the first time the cron runs it.
  const scheduledCall2 = dm
    ? new Date(now.getTime() + Math.max(0, dm.durationSeconds - STAGES[0].targetOffsetSec) * 1000).toISOString()
    : null;

  const update: any = {
    current_journey_leg: leg,
    call1_eta_timestamp: dm?.etaTimestamp ?? null,
    call1_duration_seconds: dm?.durationSeconds ?? null,
    scheduled_call2_time: scheduledCall2,
    call2_eta_timestamp: null, call2_duration_seconds: null, call2_notification_sent: false,
    scheduled_call3_time: null, call3_eta_timestamp: null, call3_duration_seconds: null, call3_notification_sent: false,
    scheduled_call4_time: null, call4_eta_timestamp: null, call4_duration_seconds: null, call4_notification_sent: false,
    scheduled_call5_time: null, call5_eta_timestamp: null, call5_duration_seconds: null, call5_notification_sent: false,
    arrived_at: null,
  };
  if (leg === "pickup") update.journey_started_at = now.toISOString();
  else update.delivery_started_at = now.toISOString();
  await supabase.from("bookings").update(update).eq("id", bookingId);
  // Seed the live ETA + its baseline (position/duration) separately — best-effort so
  // a missing migration never blocks the journey from starting.
  if (dm?.etaTimestamp) {
    await supabase.from("bookings").update({
      current_eta_timestamp: dm.etaTimestamp,
      eta_calc_at: now.toISOString(),
      eta_last_lat: driverLat,
      eta_last_lng: driverLng,
      eta_last_duration_seconds: dm.durationSeconds,
    }).eq("id", bookingId);
  }

  const dPhone = await driverPhoneOf(supabase, driver.id);
  const ctx = ctxOf(booking, leg, driverName(driver), dPhone, dest.postcode, dm ? fmtEta(dm.etaTimestamp) : undefined);
  await notifyCustomer("journey_started", ctx);
  await notifyAdmin(supabase, bookingId, "journey_started", ctx);
  await logCall(supabase, {
    bookingId, driverId: driver?.id ?? null, leg, call: "1", dLat: driverLat, dLng: driverLng,
    destLat: dest.lat, destLng: dest.lng, dur: dm?.durationSeconds ?? null, eta: dm?.etaTimestamp ?? null,
    fired: true, type: "journey_started", nextAt: scheduledCall2,
  });
  return { etaTimestamp: dm?.etaTimestamp ?? null, durationSeconds: dm?.durationSeconds ?? null };
}

const CALL_FIELD = {
  2: { scheduled: "scheduled_call2_time", eta: "call2_eta_timestamp", dur: "call2_duration_seconds", sent: "call2_notification_sent" },
  3: { scheduled: "scheduled_call3_time", eta: "call3_eta_timestamp", dur: "call3_duration_seconds", sent: "call3_notification_sent" },
  4: { scheduled: "scheduled_call4_time", eta: "call4_eta_timestamp", dur: "call4_duration_seconds", sent: "call4_notification_sent" },
  5: { scheduled: "scheduled_call5_time", eta: "call5_eta_timestamp", dur: "call5_duration_seconds", sent: "call5_notification_sent" },
} as const;

/**
 * Process one due checkpoint from the cron, cascading forward through any
 * stages the driver has already passed (using the same GPS reading) so a
 * short/fast-moving leg doesn't need to wait out a full cron cycle per stage.
 */
async function processCall(supabase: any, bookingId: string, leg: Leg, startCallNo: 2 | 3 | 4 | 5) {
  const booking = await loadBooking(supabase, bookingId);
  if (!booking || booking.arrived_at) return;
  const driver = await leadDriver(supabase, bookingId);
  const gps = driver ? await driverGps(supabase, driver.id) : null;
  const nowMs = Date.now();
  const startIdx = STAGES.findIndex((s) => s.call === startCallNo);

  if (!gps) {
    // No GPS at all yet — push this check a couple of minutes later.
    const bump = new Date(nowMs + 120_000).toISOString();
    await supabase.from("bookings").update({ [CALL_FIELD[startCallNo].scheduled]: bump }).eq("id", bookingId);
    return;
  }

  const dest = legDest(booking, leg);
  const fresh = gpsIsFresh(gps);
  let dm: { durationSeconds: number; etaTimestamp: string } | null = null;
  try { dm = await distanceMatrix(Number(gps.lat), Number(gps.lng), dest.dest); }
  catch (e) { console.error("[eta] distance matrix failed", e); }

  // Prefer a fresh live reading. If the driver's GPS hasn't moved/updated
  // recently, a live duration can be stuck (this is what silently broke every
  // checkpoint before) — fall back to the wall-clock estimate from Call 1
  // instead of trusting it, so the checkpoint still fires close to on time.
  let dur: number;
  let etaTimestamp: string;
  if (dm && fresh) {
    dur = dm.durationSeconds;
    etaTimestamp = dm.etaTimestamp;
  } else if (booking.call1_eta_timestamp) {
    dur = Math.max(0, Math.round((new Date(booking.call1_eta_timestamp).getTime() - nowMs) / 1000));
    etaTimestamp = booking.call1_eta_timestamp;
  } else if (dm) {
    // No baseline ETA to fall back to (Call 1's distance-matrix call failed) —
    // the live reading, stale or not, is all we have.
    dur = dm.durationSeconds;
    etaTimestamp = dm.etaTimestamp;
  } else {
    // No live reading AND no baseline — genuinely nothing to go on. Retry soon.
    const next = new Date(nowMs + 120_000).toISOString();
    await supabase.from("bookings").update({ [CALL_FIELD[startCallNo].scheduled]: next }).eq("id", bookingId);
    return;
  }

  const ctxBase = (etaTime?: string) => ctxOf(booking, leg, driverName(driver), driver?.phone ?? null, dest.postcode, etaTime);

  let idx = startIdx;
  while (idx < STAGES.length && dur < STAGES[idx].lowerFireSec) {
    // Already closer than this stage targets — mark it done with no message
    // and immediately check the next stage against the same data point.
    const f = CALL_FIELD[STAGES[idx].call];
    await supabase.from("bookings").update({ [f.eta]: etaTimestamp, [f.dur]: dur, [f.sent]: true }).eq("id", bookingId);
    await logCall(supabase, { bookingId, driverId: driver.id, leg, call: String(STAGES[idx].call), dLat: gps.lat, dLng: gps.lng, destLat: dest.lat, destLng: dest.lng, dur, eta: etaTimestamp, fired: false, type: null, nextAt: null });
    idx++;
  }

  if (idx >= STAGES.length) return; // past every checkpoint — arrival handles the rest

  const stage = STAGES[idx];
  const field = CALL_FIELD[stage.call];

  if (dur > stage.upperFireSec) {
    // Too early — retry this same stage later.
    const next = new Date(nowMs + stage.retryMs).toISOString();
    await supabase.from("bookings").update({ [field.scheduled]: next }).eq("id", bookingId);
    await logCall(supabase, { bookingId, driverId: driver.id, leg, call: String(stage.call), dLat: gps.lat, dLng: gps.lng, destLat: dest.lat, destLng: dest.lng, dur, eta: etaTimestamp, fired: false, type: null, nextAt: next });
    return;
  }

  // In the window — fire it.
  await notifyCustomer(stage.type, ctxBase(fmtEta(etaTimestamp)));
  await notifyAdmin(supabase, bookingId, stage.type, ctxBase());

  const nextStage = STAGES[idx + 1];
  const nextScheduled = nextStage ? new Date(new Date(etaTimestamp).getTime() - nextStage.targetOffsetSec * 1000).toISOString() : null;
  const update: any = { [field.eta]: etaTimestamp, [field.dur]: dur, [field.sent]: true };
  if (nextStage) update[CALL_FIELD[nextStage.call].scheduled] = nextScheduled;
  await supabase.from("bookings").update(update).eq("id", bookingId);
  await logCall(supabase, { bookingId, driverId: driver.id, leg, call: String(stage.call), dLat: gps.lat, dLng: gps.lng, destLat: dest.lat, destLng: dest.lng, dur, eta: etaTimestamp, fired: true, type: stage.type, nextAt: nextScheduled });
}

// Recalc the traffic-aware ETA on a TIME cadence — regardless of whether the
// driver is moving — so a driver stuck in traffic shows a GROWING ETA that tracks
// Google/Apple Maps. (The old logic "held" the ETA while the driver was barely
// moving, which reset the countdown and hid the delay: the customer saw "10 min"
// while the driver was 45 min away in traffic.) A Distance Matrix call is ~1¢, so
// we recalc every few minutes, tighter near arrival where accuracy matters most.
// Cost-conscious cadence: recalc the traffic-aware ETA every 5 minutes for the
// whole journey. (Each recalc is a Google Distance Matrix call, so we keep it to
// one per booking per 5 min.) Between recalcs the tracking page counts down from
// the last real value, so the customer still sees a smoothly falling ETA.
const ETA_REFRESH_FAR_MS = 5 * 60 * 1000;  // recalc every 5 min
const ETA_REFRESH_NEAR_MS = 5 * 60 * 1000; // same near arrival — 5 min cadence
const ETA_NEAR_MIN = 15;

/**
 * Refresh the live ETA for active journeys from the driver's GPS. Recalculates
 * (traffic-aware) once the last calc is older than the cadence above — even if
 * the driver hasn't moved — so heavy traffic pushes the ETA out. Between recalcs
 * the tracking page counts down from the last real value. Best-effort per booking.
 */
export async function refreshActiveEtas(supabase: any): Promise<{ refreshed: number; held: number }> {
  const { data: active } = await supabase
    .from("bookings")
    .select("id, current_journey_leg, current_eta_timestamp, eta_calc_at")
    .not("current_journey_leg", "is", null)
    .is("arrived_at", null);

  let refreshed = 0;
  let held = 0;
  const nowMs = Date.now();
  for (const row of active ?? []) {
    try {
      // Recalc more often the closer they are (accuracy matters most near arrival).
      const remainingMin = row.current_eta_timestamp
        ? (new Date(row.current_eta_timestamp).getTime() - nowMs) / 60000
        : Infinity;
      const interval = remainingMin <= ETA_NEAR_MIN ? ETA_REFRESH_NEAR_MS : ETA_REFRESH_FAR_MS;
      const sinceCalc = row.eta_calc_at ? nowMs - new Date(row.eta_calc_at).getTime() : Infinity;
      // Recent enough → let the page count down toward the last real ETA.
      if (sinceCalc < interval) { held++; continue; }

      const driver = await leadDriver(supabase, row.id);
      const gps = driver ? await driverGps(supabase, driver.id) : null;
      if (!gps) continue; // no live position yet — keep the last ETA

      const booking = await loadBooking(supabase, row.id);
      if (!booking) continue;
      const dest = legDest(booking, row.current_journey_leg as Leg);
      // Traffic-aware (duration_in_traffic): a jam pushes the ETA out even when the
      // driver is barely moving.
      const dm = await distanceMatrix(Number(gps.lat), Number(gps.lng), dest.dest);
      await supabase.from("bookings").update({
        current_eta_timestamp: dm.etaTimestamp,
        eta_calc_at: new Date(nowMs).toISOString(),
        eta_last_lat: Number(gps.lat),
        eta_last_lng: Number(gps.lng),
        eta_last_duration_seconds: dm.durationSeconds,
      }).eq("id", row.id);
      refreshed++;
    } catch (e) {
      console.error("[eta] live refresh failed", row.id, e);
    }
  }
  return { refreshed, held };
}

/** Cron entry: process every due checkpoint (30/20/10/5-min). */
export async function runDueEtaCalls(supabase: any): Promise<{ processed: number }> {
  const nowIso = new Date().toISOString();
  let processed = 0;

  for (const stage of STAGES) {
    const field = CALL_FIELD[stage.call];
    let query = supabase
      .from("bookings")
      .select("id, current_journey_leg")
      .lte(field.scheduled, nowIso)
      .eq(field.sent, false)
      .not("current_journey_leg", "is", null)
      .is("arrived_at", null);
    if (stage.call !== 2) query = query.not(field.scheduled, "is", null);
    const { data: due } = await query;
    for (const b of due ?? []) { await processCall(supabase, b.id, b.current_journey_leg, stage.call); processed++; }
  }

  return { processed };
}

/** CALL 4 — driver confirmed arrival (GPS-detected on device). */
export async function recordArrived(supabase: any, bookingId: string, leg: Leg, driver: any, driverLat: number, driverLng: number) {
  const booking = await loadBooking(supabase, bookingId);
  const dest = legDest(booking, leg);
  const now = new Date().toISOString();
  const update: any = { arrived_at: now };
  if (leg === "delivery") update.delivery_arrived_at = now;
  await supabase.from("bookings").update(update).eq("id", bookingId);

  const ctx = ctxOf(booking, leg, driverName(driver), driver?.phone ?? null, dest.postcode);
  await notifyCustomer("arrived", ctx);
  await notifyAdmin(supabase, bookingId, "arrived", ctx);

  // Safety net: on a short pickup journey the driver can arrive before the
  // ~20-min balance timer fires. We collect the balance BEFORE starting the job,
  // so send it now (idempotent) and clear the scheduled marker.
  if (leg === "pickup" && booking?.balance_invoice_due_at) {
    try { await autoSendFullBalanceInvoice(bookingId); } catch (e) { console.error("[arrived] balance invoice failed", e); }
    await supabase.from("bookings").update({ balance_invoice_due_at: null }).eq("id", bookingId);
  }
  await logCall(supabase, { bookingId, driverId: driver?.id ?? null, leg, call: "arrived", dLat: driverLat, dLng: driverLng, destLat: dest.lat, destLng: dest.lng, dur: null, eta: null, fired: true, type: "arrived", nextAt: null });
}
