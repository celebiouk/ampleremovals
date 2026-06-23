/**
 * Customer + admin notifications for driver journey events (ETA engine + arrived).
 * Reuses the platform's existing senders. Best-effort — a failed channel never
 * throws (the ETA engine must keep running).
 */

import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { sendAdminPush } from "@/lib/push-dispatch";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ampleremovals.com";

export type JourneyEvent = "journey_started" | "20min" | "10min" | "arrived";

export interface NotifyContext {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  reference: string;
  driverName: string;
  leg: "pickup" | "delivery";
  destinationPostcode: string;
  trackingToken: string | null;
  etaTime?: string; // formatted time, for journey_started
}

function trackLink(token: string | null): string {
  return token ? `${SITE}/track/${token}` : SITE;
}

function bodies(ev: JourneyEvent, c: NotifyContext): { email: { subject: string; html: string }; sms: string; whatsapp: string } {
  const first = c.customerName.split(" ")[0] || "there";
  const link = trackLink(c.trackingToken);
  const place = c.leg === "pickup" ? "you" : "the delivery address";
  switch (ev) {
    case "journey_started":
      return {
        email: {
          subject: "Your Ample Removals driver is on the way",
          html: `<p>Hi ${first},</p><p>Your Ample Removals driver has started their journey to ${place}. Estimated arrival: <strong>${c.etaTime ?? "shortly"}</strong>.</p><p><a href="${link}">Track your driver live →</a></p><p>Job ref: ${c.reference}</p>`,
        },
        sms: `Ample Removals: Driver ${c.driverName} has started their journey. ETA ${c.etaTime ?? "soon"}. Job ${c.reference}. Track: ${link}`,
        whatsapp: `🚚 *Your Ample Removals driver is on the way!*\n\nETA: *${c.etaTime ?? "soon"}*\nJob: ${c.reference}\n\nTrack live: ${link}`,
      };
    case "20min":
      return {
        email: {
          subject: "Your driver is about 20 minutes away",
          html: `<p>Hi ${first}, your Ample Removals driver is approximately <strong>20 minutes away</strong>. Please ensure everything is ready. Job ref: ${c.reference}.</p><p><a href="${link}">Track live →</a></p>`,
        },
        sms: `Ample Removals: Driver ${c.driverName} is 20 mins away. Job ${c.reference}. Track: ${link}`,
        whatsapp: `Your driver is *20 minutes away*. Get ready! Track live: ${link}`,
      };
    case "10min":
      return {
        email: {
          subject: "Your driver is about 10 minutes away",
          html: `<p>Hi ${first}, your driver is now <strong>10 minutes away</strong>. Please be ready. Job ref: ${c.reference}.</p><p><a href="${link}">Track live →</a></p>`,
        },
        sms: `Ample Removals: Driver 10 mins away. Job ${c.reference}. Track: ${link}`,
        whatsapp: `Almost there! Your driver is *10 minutes away*.`,
      };
    case "arrived":
      return {
        email: {
          subject: "Your Ample Removals driver has arrived",
          html: `<p>Hi ${first}, your Ample Removals driver has arrived${c.leg === "pickup" ? " at your location" : " at the delivery address"}. Please come to the door. Job ref: ${c.reference}.</p>`,
        },
        sms: `Ample Removals: Driver has arrived. Job ${c.reference}`,
        whatsapp: `Your driver is outside! 🚚`,
      };
  }
}

/** The approved WhatsApp template (+ variables) for each journey event. */
function waTemplate(ev: JourneyEvent, c: NotifyContext): {
  name: "driver_on_the_way" | "driver_20_mins_away" | "driver_10_mins_away" | "driver_arrived";
  variables: Record<string, string>;
} {
  const link = trackLink(c.trackingToken);
  switch (ev) {
    case "journey_started":
      return { name: "driver_on_the_way", variables: { "1": c.driverName, "2": c.etaTime ?? "soon", "3": c.reference, "4": link } };
    case "20min":
      return { name: "driver_20_mins_away", variables: { "1": c.reference, "2": link } };
    case "10min":
      return { name: "driver_10_mins_away", variables: { "1": c.reference } };
    case "arrived":
      return { name: "driver_arrived", variables: { "1": c.reference } };
  }
}

/** Fire all customer channels (best-effort). */
export async function notifyCustomer(ev: JourneyEvent, c: NotifyContext): Promise<void> {
  const b = bodies(ev, c);
  if (c.customerEmail) {
    try {
      await resend.emails.send({ from: resendFrom, to: c.customerEmail, subject: b.email.subject, html: b.email.html });
    } catch (e) { console.error("[driver-notify] email failed", e); }
  }
  if (c.customerPhone) {
    try { await sendSMS(c.customerPhone, b.sms); } catch (e) { console.error("[driver-notify] sms failed", e); }
    try { await sendWhatsApp(c.customerPhone, b.whatsapp, waTemplate(ev, c)); } catch (e) { console.error("[driver-notify] whatsapp failed", e); }
  }
}

/** Admin dashboard notification + push for a journey event. */
export async function notifyAdmin(
  supabase: SupabaseClient,
  bookingId: string,
  ev: JourneyEvent,
  c: NotifyContext
): Promise<void> {
  const legLabel = c.leg === "pickup" ? "Pickup" : "Delivery";
  const where = `${legLabel} ${c.customerName} ${c.destinationPostcode}`;
  const map: Record<JourneyEvent, string> = {
    journey_started: `Driver ${c.driverName} started journey to ${where}${c.etaTime ? ` — ETA ${c.etaTime}` : ""}`,
    "20min": `Driver ${c.driverName} — 20 mins from ${where}`,
    "10min": `Driver ${c.driverName} — 10 mins from ${where}`,
    arrived: `Driver ${c.driverName} — Arrived at ${where}`,
  };
  const message = map[ev];
  try {
    await supabase.from("notifications").insert({ title: "Driver update", description: message, booking_id: bookingId, is_read: false });
  } catch (e) { console.error("[driver-notify] admin notification failed", e); }
  try {
    await sendAdminPush({ title: "Driver update", body: message, data: { bookingId } });
  } catch (e) { console.error("[driver-notify] admin push failed", e); }
}
