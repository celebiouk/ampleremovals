/**
 * One-off: point your Twilio SMS number's inbound webhook at our inbox endpoint
 * so customer replies show up in the Admin Dashboard.
 *
 * Run it with your real Twilio credentials (copy them from the Twilio Console →
 * Account Info). Example (Git Bash / macOS / Linux):
 *
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxx \
 *   TWILIO_AUTH_TOKEN=your_auth_token \
 *   TWILIO_PHONE_NUMBER=+441234567890 \
 *   node scripts/configure-twilio-webhook.mjs
 *
 * PowerShell:
 *   $env:TWILIO_ACCOUNT_SID="ACxxxx"; $env:TWILIO_AUTH_TOKEN="xxxx"; $env:TWILIO_PHONE_NUMBER="+44..."; node scripts/configure-twilio-webhook.mjs
 *
 * Safe to re-run. It only changes the inbound SMS webhook URL/method.
 */
import twilio from "twilio";

const SITE_URL = process.env.SITE_URL || "https://www.ampleremovals.com";
const INCOMING = `${SITE_URL}/api/webhooks/twilio/incoming`;

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
const phone = process.env.TWILIO_PHONE_NUMBER;

if (!sid || !sid.startsWith("AC")) { console.error("Set TWILIO_ACCOUNT_SID (starts with AC)."); process.exit(1); }
if (!token && !(apiKeySid && apiKeySecret)) { console.error("Set TWILIO_AUTH_TOKEN (or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET)."); process.exit(1); }
if (!phone) { console.error("Set TWILIO_PHONE_NUMBER (e.g. +441234567890)."); process.exit(1); }

const client = apiKeySid && apiKeySecret ? twilio(apiKeySid, apiKeySecret, { accountSid: sid }) : twilio(sid, token);

const nums = await client.incomingPhoneNumbers.list({ limit: 50 });
const match = nums.find((n) => n.phoneNumber === phone);
if (!match) {
  console.error(`\n${phone} isn't in this account. Your numbers:`);
  nums.forEach((n) => console.error("  -", n.phoneNumber));
  process.exit(1);
}

console.log("Before →", match.phoneNumber, "smsUrl:", match.smsUrl || "(none)", match.smsMethod);
const updated = await client.incomingPhoneNumbers(match.sid).update({ smsUrl: INCOMING, smsMethod: "POST" });
console.log("After  →", updated.phoneNumber, "smsUrl:", updated.smsUrl, updated.smsMethod);
console.log("\n✅ SMS inbound webhook configured. Text this number and it'll appear in Admin → Messages.");
console.log("\nWhatsApp: set the SAME URL as the inbound webhook on your WhatsApp sender/sandbox:");
console.log("   Twilio Console → Messaging → (WhatsApp sandbox settings, or your WhatsApp sender)");
console.log("   'When a message comes in' →", INCOMING, "(HTTP POST)");
