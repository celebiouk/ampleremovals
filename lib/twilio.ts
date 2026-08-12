import twilio from "twilio";
import { WHATSAPP_TEMPLATES, type WhatsAppTemplate } from "@/lib/whatsapp-templates";
import { createAdminClient } from "@/lib/supabase/server";
import { recordMessage, normalisePhone, type Channel } from "@/lib/message-store";

/**
 * Twilio client. Prefers API Key auth (TWILIO_API_KEY_SID + _SECRET, the
 * recommended/revocable credentials) and falls back to the account Auth Token.
 * Guarded so builds/dev don't crash when credentials are still placeholders.
 *
 * Required env: TWILIO_ACCOUNT_SID (AC…) plus EITHER
 *   • TWILIO_API_KEY_SID (SK…) + TWILIO_API_KEY_SECRET   (recommended), OR
 *   • TWILIO_AUTH_TOKEN
 */
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

export const twilioClient =
  accountSid && accountSid.startsWith("AC") && apiKeySid?.startsWith("SK") && apiKeySecret
    ? twilio(apiKeySid, apiKeySecret, { accountSid })
    : accountSid && accountSid.startsWith("AC") && authToken
      ? twilio(accountSid, authToken)
      : null;

export const twilioFrom = process.env.TWILIO_PHONE_NUMBER ?? "";
export const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886"; // Twilio sandbox default

/** Twilio posts delivery status here (prod only — it can't reach localhost). */
const STATUS_CALLBACK = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https")
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio/status`
  : undefined;

export interface SendResult { success: boolean; error?: string; sid?: string; messageId?: string | null }

/**
 * Persist an outbound message to the inbox (best-effort — never blocks sending).
 * Every SMS/WhatsApp the system sends flows through here, so the dashboard's
 * conversation history is complete without touching each call site.
 */
async function logOutbound(p: {
  contactPhone: string; from: string; to: string; body: string; channel: Channel;
  sid: string | null; status: string; error?: string | null;
}): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const res = await recordMessage(supabase, {
      contactPhone: p.contactPhone,
      twilioSid: p.sid,
      channel: p.channel,
      direction: "outbound",
      fromNumber: p.from,
      toNumber: p.to,
      body: p.body,
      status: p.status || "queued",
      errorMessage: p.error ?? null,
    });
    return res.messageId;
  } catch (e) {
    console.warn("[twilio] outbound log failed:", e);
    return null;
  }
}

/**
 * GSM-7 segment size: 160 chars for a single SMS, 153 per part when concatenated.
 * A single non-GSM-7 char (emoji, £, em-dash, curly quote) flips the WHOLE message
 * to Unicode = only 70/67 chars per segment — tripling the cost. So we normalise
 * every SMS to plain GSM-7 and cap it at 2 segments. WhatsApp is NOT normalised
 * (no per-segment cost, and emoji render fine there).
 */
const SMS_2_SEGMENTS = 306; // 153 * 2 (concatenated GSM-7)

export function normaliseSmsBody(body: string): string {
  const text = body
    .replace(/£\s*/g, "GBP ")        // pound sign forces Unicode → spell it out
    .replace(/[—–]/g, "-")            // em/en dash → hyphen
    .replace(/['‘’‚]/g, "'")          // curly single quotes → straight
    .replace(/["“”„]/g, '"')          // curly double quotes → straight
    .replace(/…/g, "...")
    // strip emoji, pictographs, symbols, variation selectors, ZWJ, keycaps
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/[ \t]{2,}/g, " ")       // collapse the spaces emoji removal leaves
    .replace(/ *\n */g, "\n")
    .trim();
  // Hard guarantee of "no more than 2 segments".
  return text.length > SMS_2_SEGMENTS ? text.slice(0, SMS_2_SEGMENTS).trimEnd() : text;
}

/**
 * Send an SMS via Twilio. The body is normalised (GBP not £, no emoji, ≤2 segments)
 * to keep it in GSM-7 and minimise per-segment cost.
 * Returns { success: true } on success, { success: false, error: string } on failure.
 */
export async function sendSMS(to: string, body: string): Promise<SendResult> {
  if (!twilioClient || !twilioFrom) {
    return { success: false, error: "Twilio not configured" };
  }
  // Twilio needs E.164 (+44…). Local "07…" or a number with stray spaces gets
  // rejected, so normalise before sending.
  const dest = normalisePhone(to) || to;
  const text = normaliseSmsBody(body);
  try {
    const msg = await twilioClient.messages.create({
      from: twilioFrom,
      to: dest,
      body: text,
      ...(STATUS_CALLBACK ? { statusCallback: STATUS_CALLBACK } : {}),
    });
    const messageId = await logOutbound({ contactPhone: dest, from: twilioFrom, to: dest, body: text, channel: "sms", sid: msg.sid, status: msg.status || "queued" });
    return { success: true, sid: msg.sid, messageId };
  } catch (err) {
    // Save the failed attempt so it's visible + retryable, never silently lost.
    await logOutbound({ contactPhone: dest, from: twilioFrom, to: dest, body: text, channel: "sms", sid: null, status: "failed", error: String(err) });
    return { success: false, error: String(err) };
  }
}

/**
 * Send a WhatsApp message via Twilio.
 *
 * WhatsApp blocks business-initiated free-form text outside the 24h customer
 * window (error 63016) — those must use a pre-approved template. So when a
 * `template` is supplied we send via its Content SID + variables; if that send
 * fails (e.g. the template isn't approved by Meta yet) we fall back to the
 * free-text `body`, which still delivers inside the 24h window. Calls without a
 * template (e.g. admin alerts / session replies) just send free text.
 *
 * The 'to' number must be in E.164 format, e.g., "+447700900000".
 */
export async function sendWhatsApp(
  to: string,
  body: string,
  template?: { name: WhatsAppTemplate; variables: Record<string, string> },
): Promise<SendResult> {
  if (!twilioClient) {
    return { success: false, error: "Twilio not configured" };
  }
  // WhatsApp only accepts E.164 (+44…). Sending to "whatsapp:07…" (or a number
  // with stray spaces) is rejected as "failed" — normalise it first.
  const dest = normalisePhone(to) || to;
  const waTo = `whatsapp:${dest}`;
  // What we store as the body for the inbox (template renders to `body` text).
  const loggedBody = body || (template ? `[template: ${template.name}]` : "");
  const contentSid = template ? WHATSAPP_TEMPLATES[template.name] : undefined;

  // Preferred path: send via the approved template.
  if (contentSid) {
    try {
      const msg = await twilioClient.messages.create({
        from: twilioWhatsAppFrom,
        to: waTo,
        contentSid,
        contentVariables: JSON.stringify(template!.variables),
        ...(STATUS_CALLBACK ? { statusCallback: STATUS_CALLBACK } : {}),
      });
      const messageId = await logOutbound({ contactPhone: dest, from: twilioWhatsAppFrom, to: waTo, body: loggedBody, channel: "whatsapp", sid: msg.sid, status: msg.status || "queued" });
      return { success: true, sid: msg.sid, messageId };
    } catch (err) {
      // Template not approved yet / send failed — fall through to free text.
      if (!body) {
        await logOutbound({ contactPhone: dest, from: twilioWhatsAppFrom, to: waTo, body: loggedBody, channel: "whatsapp", sid: null, status: "failed", error: String(err) });
        return { success: false, error: String(err) };
      }
    }
  }
  try {
    const msg = await twilioClient.messages.create({
      from: twilioWhatsAppFrom,
      to: waTo,
      body,
      ...(STATUS_CALLBACK ? { statusCallback: STATUS_CALLBACK } : {}),
    });
    const messageId = await logOutbound({ contactPhone: dest, from: twilioWhatsAppFrom, to: waTo, body, channel: "whatsapp", sid: msg.sid, status: msg.status || "queued" });
    return { success: true, sid: msg.sid, messageId };
  } catch (err) {
    await logOutbound({ contactPhone: dest, from: twilioWhatsAppFrom, to: waTo, body, channel: "whatsapp", sid: null, status: "failed", error: String(err) });
    return { success: false, error: String(err) };
  }
}
