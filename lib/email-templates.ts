/**
 * Pre-built email templates for all common customer communications.
 * Each template has a subject, body (with {{variable}} placeholders),
 * and a short SMS version (max 160 chars).
 */

export interface EmailTemplate {
  id: string;
  label: string;
  category: "booking" | "invoice" | "followup" | "general";
  subject: string;
  body: string;
  smsBody: string; // short version, max 160 chars
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ── Booking & Enquiry ──────────────────────────────────────────────
  {
    id: "enquiry_received",
    label: "Enquiry Received",
    category: "booking",
    subject: "We've received your enquiry — Ref: {{ref}}",
    body: `Hi {{name}},

Thank you for getting in touch with Ample Removals.

We've received your {{service}} enquiry (Ref: {{ref}}) and one of our team will be calling you shortly to discuss your requirements and provide a quote.

If you'd like to speak to us in the meantime, please don't hesitate to call us on {{company_phone}}.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, thanks for your {{service}} enquiry ({{ref}}). We'll call you shortly. Questions? Ring {{company_phone}}.`,
  },
  {
    id: "quote_ready",
    label: "Your Quote Is Ready",
    category: "booking",
    subject: "Your {{service}} quote — Ref: {{ref}}",
    body: `Hi {{name}},

Thank you for speaking with us about your upcoming {{service}}.

We've put together your quote based on the details you provided. Please see the details below:

Reference: {{ref}}
Service: {{service}}
Move Date: {{date}}
From: {{origin}}

To proceed with your booking, please reply to this email or call us on {{company_phone}} and we'll get everything confirmed for you.

We look forward to hearing from you.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your {{service}} quote ({{ref}}) is ready. Call {{company_phone}} or reply to your email to proceed.`,
  },
  {
    id: "booking_confirmed",
    label: "Booking Confirmed",
    category: "booking",
    subject: "Your booking is confirmed — Ref: {{ref}}",
    body: `Hi {{name}},

Great news — your {{service}} booking is confirmed!

Here are your booking details:
  Reference:  {{ref}}
  Move Date:  {{date}}
  From:       {{origin}}

Our team will be in touch 24 hours before your move date to confirm the arrival window.

If you have any questions or need to make changes, please call us on {{company_phone}} — we're always happy to help.

Thank you for choosing {{company_name}}!

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your {{service}} ({{ref}}) is confirmed for {{date}}. We'll call 24hrs before. Questions? {{company_phone}}`,
  },
  {
    id: "date_change",
    label: "Move Date Changed",
    category: "booking",
    subject: "Important: Your move date has been updated — Ref: {{ref}}",
    body: `Hi {{name}},

We're writing to let you know that your {{service}} booking (Ref: {{ref}}) has been updated.

Your new move date is: {{date}}

If this date doesn't work for you, please call us as soon as possible on {{company_phone}} and we'll do our best to find a time that suits you.

We apologise for any inconvenience and look forward to helping you on your new date.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your {{service}} ({{ref}}) has been rescheduled to {{date}}. Not right? Call {{company_phone}}.`,
  },
  {
    id: "booking_cancelled",
    label: "Booking Cancelled",
    category: "booking",
    subject: "Your booking has been cancelled — Ref: {{ref}}",
    body: `Hi {{name}},

We're writing to confirm that your {{service}} booking (Ref: {{ref}}) has been cancelled as requested.

If you change your mind or need our services in the future, we'd love to hear from you. You can reach us on {{company_phone}} or visit our website.

We hope to help you again in the future.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your {{service}} booking ({{ref}}) has been cancelled. Need us in future? {{company_phone}}`,
  },

  // ── Follow-Up & Contact ────────────────────────────────────────────
  {
    id: "missed_call",
    label: "We Tried to Call You",
    category: "followup",
    subject: "We tried to reach you — Ref: {{ref}}",
    body: `Hi {{name}},

We tried to call you today regarding your {{service}} enquiry (Ref: {{ref}}) but unfortunately we couldn't get through.

We'd love to chat with you about your requirements and get a quote sorted. Please give us a call back on {{company_phone}} at your convenience, or simply reply to this email and we'll arrange a suitable time to call you.

We look forward to speaking with you.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, we tried to call about your {{service}} ({{ref}}). Please call us back on {{company_phone}} when you're free.`,
  },
  {
    id: "follow_up",
    label: "Following Up on Your Enquiry",
    category: "followup",
    subject: "Following up on your {{service}} enquiry — Ref: {{ref}}",
    body: `Hi {{name}},

We're just following up on your {{service}} enquiry (Ref: {{ref}}) that you submitted recently.

We'd love to help with your move — if you're still interested, please give us a call on {{company_phone}} or reply to this email and we'll get everything sorted for you quickly.

If your plans have changed, no problem at all — just let us know.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, just following up on your {{service}} enquiry ({{ref}}). Still interested? Call {{company_phone}} — we'd love to help!`,
  },
  {
    id: "day_before",
    label: "Reminder: Move Is Tomorrow",
    category: "followup",
    subject: "Reminder: Your {{service}} is tomorrow — Ref: {{ref}}",
    body: `Hi {{name}},

This is a friendly reminder that your {{service}} is scheduled for tomorrow.

  Reference:  {{ref}}
  Date:       {{date}}
  From:       {{origin}}

Our team will aim to arrive in the morning. We'll give you a call if there are any changes to the timing.

Please make sure that access is available and any special items are ready. If you need to contact us, please call {{company_phone}}.

We look forward to seeing you tomorrow!

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, reminder: your {{service}} ({{ref}}) is tomorrow {{date}}. We'll arrive in the morning. Questions? {{company_phone}}`,
  },
  {
    id: "review_request",
    label: "How Did We Do?",
    category: "followup",
    subject: "How was your experience with {{company_name}}?",
    body: `Hi {{name}},

We hope your {{service}} went smoothly and that you're settling in well!

We'd love to hear how we did. If you have a moment, it would mean the world to us if you could leave us a quick review:

{{google_review_link}}

Your feedback helps us improve and helps other customers find us — it really does make a difference.

Thank you again for choosing {{company_name}}. We hope to help you again in the future.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, hope your {{service}} went well! Please leave us a review: {{google_review_link}} — thank you!`,
  },

  // ── Invoice & Payment ──────────────────────────────────────────────
  {
    id: "deposit_request",
    label: "Deposit Invoice — Please Pay to Confirm",
    category: "invoice",
    subject: "Deposit invoice for your {{service}} — Ref: {{ref}}",
    body: `Hi {{name}},

Thank you for choosing {{company_name}} for your {{service}}.

To confirm your booking, we require a deposit payment. Please find your deposit invoice attached to this email.

  Invoice Number:    {{invoice_number}}
  Full Job Price:    {{full_price}}
  Deposit Due Now:   {{deposit_amount}}
  Balance Remaining: {{balance}}
  Due Date:          {{due_date}}

You can pay securely online using the link below:
{{payment_link}}

Once your deposit is received, your booking will be officially confirmed and we'll send you a confirmation email.

If you have any questions, please don't hesitate to call us on {{company_phone}}.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your deposit invoice ({{invoice_number}}) for {{deposit_amount}} is ready. Pay here: {{payment_link}}`,
  },
  {
    id: "balance_invoice",
    label: "Final Balance Invoice",
    category: "invoice",
    subject: "Final balance invoice — {{service}} — Ref: {{ref}}",
    body: `Hi {{name}},

Thank you for using {{company_name}} for your {{service}}.

Please find your final balance invoice attached to this email.

  Invoice Number: {{invoice_number}}
  Amount Due:     {{amount}}
  Due Date:       {{due_date}}

You can pay securely online using the link below:
{{payment_link}}

Thank you for your business — we really appreciate it.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your final invoice ({{invoice_number}}) for {{amount}} is ready. Pay here: {{payment_link}}`,
  },
  {
    id: "payment_reminder",
    label: "Payment Reminder",
    category: "invoice",
    subject: "Friendly reminder: Invoice {{invoice_number}} is awaiting payment",
    body: `Hi {{name}},

We're writing with a friendly reminder that your invoice {{invoice_number}} for {{amount}} is still awaiting payment.

  Amount Due:  {{amount}}
  Due Date:    {{due_date}}

You can pay securely online here:
{{payment_link}}

If you've already made the payment, please disregard this message. If you have any questions or need to discuss payment arrangements, please call us on {{company_phone}}.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, reminder: invoice {{invoice_number}} for {{amount}} is due. Pay: {{payment_link}} or call {{company_phone}}.`,
  },
  {
    id: "payment_received",
    label: "Payment Received — Thank You",
    category: "invoice",
    subject: "Payment received — Thank you! — Ref: {{ref}}",
    body: `Hi {{name}},

We've received your payment — thank you!

  Invoice:        {{invoice_number}}
  Amount Paid:    {{amount}}
  Date Received:  {{date}}

{{#if deposit}}Your booking is now confirmed. We look forward to helping you on {{move_date}}.{{/if}}
{{#if final}}Thank you for completing your payment. We hope everything went perfectly!{{/if}}

If you have any questions, please call us on {{company_phone}}.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, we've received your payment of {{amount}} for {{ref}}. Thank you! — {{company_name}}`,
  },

  // ── General ────────────────────────────────────────────────────────
  {
    id: "general_update",
    label: "General Update",
    category: "general",
    subject: "Update regarding your {{service}} — Ref: {{ref}}",
    body: `Hi {{name}},

We're writing with an update regarding your {{service}} booking (Ref: {{ref}}).

{{custom_message}}

If you have any questions, please don't hesitate to call us on {{company_phone}}.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, update re your {{service}} ({{ref}}): {{custom_message_short}} — {{company_name}}`,
  },
  {
    id: "special_instructions",
    label: "Special Instructions / Info Needed",
    category: "general",
    subject: "We need a few details from you — Ref: {{ref}}",
    body: `Hi {{name}},

To ensure your {{service}} goes as smoothly as possible, we need a few additional details from you.

{{custom_message}}

Please reply to this email or call us on {{company_phone}} with the information at your earliest convenience.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, we need a few details for your {{service}} ({{ref}}). Please call {{company_phone}} or reply to our email.`,
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "All Templates" },
  { id: "booking", label: "Booking" },
  { id: "invoice", label: "Invoice & Payment" },
  { id: "followup", label: "Follow-Up" },
  { id: "general", label: "General" },
] as const;

export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id);
}
