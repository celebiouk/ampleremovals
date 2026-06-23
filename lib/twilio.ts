import twilio from "twilio";

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
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient || !twilioFrom) {
    return { success: false, error: "Twilio not configured" };
  }
  try {
    await twilioClient.messages.create({
      from: twilioFrom,
      to,
      body: normaliseSmsBody(body),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Send a WhatsApp message via Twilio.
 * The 'to' number must be in E.164 format, e.g., "+447700900000".
 * Returns { success: true } on success, { success: false, error: string } on failure.
 */
export async function sendWhatsApp(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient) {
    return { success: false, error: "Twilio not configured" };
  }
  try {
    await twilioClient.messages.create({
      from: twilioWhatsAppFrom,
      to: `whatsapp:${to}`,
      body,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
