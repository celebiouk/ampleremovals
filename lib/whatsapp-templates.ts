/**
 * WhatsApp Content Template SIDs (Twilio Content API).
 *
 * Created + submitted for WhatsApp approval on 2026-06-23. Each maps a message
 * type to its approved (or pending) Twilio Content SID. Business-initiated
 * WhatsApp messages MUST be sent via one of these templates (free-form text only
 * works inside the 24h customer-initiated window — see WHATSAPP_TEMPLATES.md).
 *
 * Template bodies + variable order live in WHATSAPP_TEMPLATES.md. When sending,
 * pass contentSid + contentVariables ({ "1": ..., "2": ... }) in the order the
 * template defines.
 */
export const WHATSAPP_TEMPLATES = {
  // A. Core customer journey (UTILITY)
  // Pending Meta approval — set WHATSAPP_LEAD_DETAILS_SID once Twilio issues the
  // Content SID; until then sendWhatsApp() falls back to free text automatically.
  lead_details_request: process.env.WHATSAPP_LEAD_DETAILS_SID ?? "",
  quote_ready: "HX1ae25e96643c687667ccbc942ee3b33c",
  quote_followup: "HXc2761401b99ab9aeceef7a5c74f8ebb4",
  booking_confirmed: "HX16d26e3fdcf5166604a6cce411a27d0c",
  final_invoice_sent: "HXeec48d844a19ca016db55806a1c498d4",
  review_request: "HX0ca6f0a9c7c4ae4e62236bc5fb611b0f",
  address_confirmation_request: "HX4712779f497c8fce3f991ce456187c0d",
  booking_details_updated: "HXdae340de9ccd6428ba6bc9d52cafccbb",
  reschedule_confirmed: "HXb5cd3058bbf7955296875d3246149abd",
  // B. Driver ETA & move-day (UTILITY)
  driver_on_the_way: "HX0b387a7b731f3fa4ba9290a7909ff48b",
  driver_20_mins_away: "HX834fee3617b82703ef888a6ff7413e04",
  driver_10_mins_away: "HX58859e022b877069b4139ec02dd2b013",
  driver_15_mins_to_delivery: "HXd37f59435fd5eac6c2fb65d688f7c003",
  driver_arrived: "HXa523054acb1f74d54dc0d413cbd7e8c0",
  driver_running_late: "HX77ee9099a494269bc56abcbcc02fd013",
  move_reminder_7_day: "HX16896f9e52ee8ab0a2dbf18e56495f8e",
  move_reminder_5_day: "HX47c056f6edf37e5da6f9f12d6680d394",
  move_reminder_3_day: "HXa592e8ee68c3e5e8a9a8e91af1ffd623",
  move_reminder_1_day: "HXb44a7e1c8001c6f10b04cffc587380c2",
  weather_alert: "HXd5b3a69133bbf8d62fc78c0519cde78e",
  // C. Driver-facing (UTILITY)
  driver_job_assigned: "HXf0aa6475be5f0564f1688453e336f284",
  driver_jobs_tomorrow: "HX6b931795a45d6aa1f6289e3dbe143902",
  // D. Promotional (MARKETING)
  anniversary_offer: "HX80fa7e248d20833df6011c457bc4f77d",
  loyalty_offer_3_month: "HXf4c9880fb6257ea6105cae4f40b62ca8",
  referral_invite: "HXed4cdd4ad383c53fbcde4066bd7575ff",
  seasonal_campaign: "HXee8965072b2f3689f730f855cf9c36c6",
} as const;

export type WhatsAppTemplate = keyof typeof WHATSAPP_TEMPLATES;
