/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Smart-ETA orchestration (server-side brain of the hybrid engine).
 *
 * Call 1 runs synchronously when the driver taps "Start Journey" (instant ETA).
 * Calls 2 & 3 are fired by the 1-minute cron from scheduled_callN_time, using the
 * driver's last uploaded GPS. Arrived (Call 4) is GPS-detected on the device and
 * confirmed via recordArrived(). Every call is written to journey_eta_log.
 *
 * Thresholds (per spec):
 *  Call 2: 900–1320s → fire 20-min; >1320 → retry +5min; <900 → skip, go to Call 3.
 *  Call 3: 480–720s  → fire 10-min; >720  → retry +3min; <480 → skip (arrival imminent).
 *  scheduled_call2 = start + (duration − 1200s); scheduled_call3 = call2 ETA − 600s.
 */

import { distanceMatrix } from "./google-maps";
import { notifyCustomer, notifyAdmin, type NotifyContext, type JourneyEvent } from "./driver-notify";

export type Leg = "pickup" | "delivery";

const fmt = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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

function ctxOf(booking: any, leg: Leg, dName: string, postcode: string, etaTime?: string): NotifyContext {
  return {
    customerName: booking.customer?.full_name ?? "Customer",
    customerEmail: booking.customer?.email ?? null,
    customerPhone: booking.customer?.phone ?? null,
    reference: booking.reference,
    driverName: dName,
    leg,
    destinationPostcode: postcode,
    trackingToken: booking.live_tracking_token ?? null,
    etaTime,
  };
}

async function leadDriver(supabase: any, bookingId: string) {
  const { data } = await supabase
    .from("booking_driver_assignments")
    .select("driver_id, is_lead_driver, drivers(id, first_name, preferred_name)")
    .eq("booking_id", bookingId)
    .order("is_lead_driver", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.drivers ?? null;
}

async function driverGps(supabase: any, driverId: string) {
  const { data } = await supabase.from("driver_locations").select("lat,lng").eq("driver_id", driverId).maybeSingle();
  return data;
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
  // Schedule the 20-min check only when we have a real ETA (Calls 2/3 also need the API).
  const scheduledCall2 = dm
    ? new Date(now.getTime() + Math.max(0, dm.durationSeconds - 1200) * 1000).toISOString()
    : null;

  const update: any = {
    current_journey_leg: leg,
    call1_eta_timestamp: dm?.etaTimestamp ?? null,
    call1_duration_seconds: dm?.durationSeconds ?? null,
    scheduled_call2_time: scheduledCall2,
    call2_eta_timestamp: null, call2_duration_seconds: null, call2_notification_sent: false,
    scheduled_call3_time: null, call3_eta_timestamp: null, call3_duration_seconds: null, call3_notification_sent: false,
    arrived_at: null,
  };
  if (leg === "pickup") update.journey_started_at = now.toISOString();
  else update.delivery_started_at = now.toISOString();
  await supabase.from("bookings").update(update).eq("id", bookingId);

  const ctx = ctxOf(booking, leg, driverName(driver), dest.postcode, dm ? fmt(dm.etaTimestamp) : undefined);
  await notifyCustomer("journey_started", ctx);
  await notifyAdmin(supabase, bookingId, "journey_started", ctx);
  await logCall(supabase, {
    bookingId, driverId: driver?.id ?? null, leg, call: "1", dLat: driverLat, dLng: driverLng,
    destLat: dest.lat, destLng: dest.lng, dur: dm?.durationSeconds ?? null, eta: dm?.etaTimestamp ?? null,
    fired: true, type: "journey_started", nextAt: scheduledCall2,
  });
  return { etaTimestamp: dm?.etaTimestamp ?? null, durationSeconds: dm?.durationSeconds ?? null };
}

/** Process one due scheduled call (2 or 3) from the cron. */
async function processCall(supabase: any, bookingId: string, leg: Leg, callNo: 2 | 3) {
  const booking = await loadBooking(supabase, bookingId);
  if (!booking || booking.arrived_at) return;
  const driver = await leadDriver(supabase, bookingId);
  const gps = driver ? await driverGps(supabase, driver.id) : null;
  const nowMs = Date.now();

  if (!gps) {
    // No GPS yet — push the check a couple of minutes later.
    const bump = new Date(nowMs + 120_000).toISOString();
    await supabase.from("bookings").update(callNo === 2 ? { scheduled_call2_time: bump } : { scheduled_call3_time: bump }).eq("id", bookingId);
    return;
  }

  const dest = legDest(booking, leg);
  let dm;
  try { dm = await distanceMatrix(Number(gps.lat), Number(gps.lng), dest.dest); }
  catch (e) { console.error("[eta] distance matrix failed", e); return; }
  const dur = dm.durationSeconds;
  const ctxBase = (etaTime?: string) => ctxOf(booking, leg, driverName(driver), dest.postcode, etaTime);

  if (callNo === 2) {
    if (dur > 1320) {
      const next = new Date(nowMs + 300_000).toISOString(); // +5 min
      await supabase.from("bookings").update({ scheduled_call2_time: next }).eq("id", bookingId);
      await logCall(supabase, { bookingId, driverId: driver.id, leg, call: "2", dLat: gps.lat, dLng: gps.lng, destLat: dest.lat, destLng: dest.lng, dur, eta: dm.etaTimestamp, fired: false, type: null, nextAt: next });
      return;
    }
    let fired = false;
    if (dur >= 900) {
      await notifyCustomer("20min", ctxBase());
      await notifyAdmin(supabase, bookingId, "20min", ctxBase());
      fired = true;
    }
    const scheduledCall3 = new Date(new Date(dm.etaTimestamp).getTime() - 600_000).toISOString(); // ETA − 10min
    await supabase.from("bookings").update({
      call2_eta_timestamp: dm.etaTimestamp, call2_duration_seconds: dur, call2_notification_sent: true, scheduled_call3_time: scheduledCall3,
    }).eq("id", bookingId);
    await logCall(supabase, { bookingId, driverId: driver.id, leg, call: "2", dLat: gps.lat, dLng: gps.lng, destLat: dest.lat, destLng: dest.lng, dur, eta: dm.etaTimestamp, fired, type: fired ? "20min" : null, nextAt: scheduledCall3 });
    return;
  }

  // callNo === 3
  if (dur > 720) {
    const next = new Date(nowMs + 180_000).toISOString(); // +3 min
    await supabase.from("bookings").update({ scheduled_call3_time: next }).eq("id", bookingId);
    await logCall(supabase, { bookingId, driverId: driver.id, leg, call: "3", dLat: gps.lat, dLng: gps.lng, destLat: dest.lat, destLng: dest.lng, dur, eta: dm.etaTimestamp, fired: false, type: null, nextAt: next });
    return;
  }
  let fired = false;
  if (dur >= 480) {
    await notifyCustomer("10min", ctxBase());
    await notifyAdmin(supabase, bookingId, "10min", ctxBase());
    fired = true;
  }
  await supabase.from("bookings").update({
    call3_eta_timestamp: dm.etaTimestamp, call3_duration_seconds: dur, call3_notification_sent: true,
  }).eq("id", bookingId);
  await logCall(supabase, { bookingId, driverId: driver.id, leg, call: "3", dLat: gps.lat, dLng: gps.lng, destLat: dest.lat, destLng: dest.lng, dur, eta: dm.etaTimestamp, fired, type: fired ? "10min" : null, nextAt: null });
}

/** Cron entry: process every due Call 2 / Call 3. */
export async function runDueEtaCalls(supabase: any): Promise<{ processed: number }> {
  const nowIso = new Date().toISOString();
  let processed = 0;

  const { data: due2 } = await supabase
    .from("bookings")
    .select("id, current_journey_leg")
    .lte("scheduled_call2_time", nowIso)
    .eq("call2_notification_sent", false)
    .not("current_journey_leg", "is", null)
    .is("arrived_at", null);
  for (const b of due2 ?? []) { await processCall(supabase, b.id, b.current_journey_leg, 2); processed++; }

  const { data: due3 } = await supabase
    .from("bookings")
    .select("id, current_journey_leg")
    .lte("scheduled_call3_time", nowIso)
    .eq("call3_notification_sent", false)
    .not("scheduled_call3_time", "is", null)
    .not("current_journey_leg", "is", null)
    .is("arrived_at", null);
  for (const b of due3 ?? []) { await processCall(supabase, b.id, b.current_journey_leg, 3); processed++; }

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

  const ctx = ctxOf(booking, leg, driverName(driver), dest.postcode);
  await notifyCustomer("arrived", ctx);
  await notifyAdmin(supabase, bookingId, "arrived", ctx);
  await logCall(supabase, { bookingId, driverId: driver?.id ?? null, leg, call: "arrived", dLat: driverLat, dLng: driverLng, destLat: dest.lat, destLng: dest.lng, dur: null, eta: null, fired: true, type: "arrived", nextAt: null });
}
