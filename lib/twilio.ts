import twilio from "twilio";

/**
 * Twilio client. Guarded so that builds and dev servers don't crash when
 * SMS credentials are still placeholders — the client is only constructed
 * when both SID and auth token are present.
 */
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export const twilioClient =
  accountSid && accountSid.startsWith("AC") && authToken
    ? twilio(accountSid, authToken)
    : null;

export const twilioFrom = process.env.TWILIO_PHONE_NUMBER ?? "";
export const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886"; // Twilio sandbox default

/**
 * Send an SMS via Twilio.
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
      body,
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
