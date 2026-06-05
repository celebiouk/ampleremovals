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
