/**
 * Curated message templates for mobile (the most-used ones from the web
 * email-templates library). Placeholders are substituted with booking data.
 */

export interface MessageTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
  smsBody: string;
}

export const COMPANY = {
  name: "Ample Removals",
  phone: "0333 577 2070",
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "custom",
    label: "Custom message",
    subject: "",
    body: "",
    smsBody: "",
  },
  {
    id: "enquiry_received",
    label: "Enquiry Received",
    subject: "We've received your enquiry — Ref: {{ref}}",
    body: `Hi {{name}},

Thank you for getting in touch with {{company_name}}.

We've received your {{service}} enquiry (Ref: {{ref}}) and one of our team will be calling you shortly to discuss your requirements and provide a quote.

If you'd like to speak to us in the meantime, please call us on {{company_phone}}.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, thanks for your {{service}} enquiry ({{ref}}). We'll call you shortly. Questions? Ring {{company_phone}}.`,
  },
  {
    id: "quote_ready",
    label: "Quote Ready",
    subject: "Your {{service}} quote — Ref: {{ref}}",
    body: `Hi {{name}},

Thank you for speaking with us about your upcoming {{service}}.

We've put together your quote (Ref: {{ref}}). To proceed, please reply to this email or call us on {{company_phone}} and we'll get everything confirmed for you.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your {{service}} quote ({{ref}}) is ready. Call {{company_phone}} to proceed.`,
  },
  {
    id: "booking_confirmed",
    label: "Booking Confirmed",
    subject: "Your booking is confirmed — Ref: {{ref}}",
    body: `Hi {{name}},

Great news — your {{service}} booking is confirmed!

Reference: {{ref}}
Move date: {{date}}

Our team will be in touch 24 hours before your move date to confirm the arrival window. Questions? Call {{company_phone}}.

Thank you for choosing {{company_name}}!`,
    smsBody: `Hi {{name}}, your {{service}} ({{ref}}) is confirmed for {{date}}. We'll call 24hrs before. {{company_phone}}`,
  },
  {
    id: "date_change",
    label: "Move Date Changed",
    subject: "Your move date has been updated — Ref: {{ref}}",
    body: `Hi {{name}},

Your {{service}} booking (Ref: {{ref}}) has been updated. Your new move date is: {{date}}.

If this date doesn't work for you, please call us on {{company_phone}}.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, your {{service}} ({{ref}}) has been rescheduled to {{date}}. Not right? Call {{company_phone}}.`,
  },
  {
    id: "missed_call",
    label: "We Tried to Call",
    subject: "We tried to reach you — Ref: {{ref}}",
    body: `Hi {{name}},

We tried to call you today about your {{service}} enquiry (Ref: {{ref}}) but couldn't get through.

Please call us back on {{company_phone}} when you're free, or reply to this email and we'll arrange a good time.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, we tried to call about your {{service}} ({{ref}}). Please call back on {{company_phone}}.`,
  },
  {
    id: "follow_up",
    label: "Following Up",
    subject: "Following up on your {{service}} enquiry — Ref: {{ref}}",
    body: `Hi {{name}},

We're just following up on your {{service}} enquiry (Ref: {{ref}}).

If you're still interested, please call us on {{company_phone}} or reply to this email and we'll get everything sorted quickly.

Kind regards,
{{company_name}}`,
    smsBody: `Hi {{name}}, following up on your {{service}} enquiry ({{ref}}). Still keen? Call {{company_phone}}.`,
  },
];

export interface TemplateVars {
  name: string;
  service: string;
  ref: string;
  date: string;
  origin: string;
}

/** Replace {{placeholders}} with booking data. */
export function applyTemplate(text: string, vars: TemplateVars): string {
  return text
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{service\}\}/g, vars.service)
    .replace(/\{\{ref\}\}/g, vars.ref)
    .replace(/\{\{date\}\}/g, vars.date)
    .replace(/\{\{origin\}\}/g, vars.origin)
    .replace(/\{\{company_phone\}\}/g, COMPANY.phone)
    .replace(/\{\{company_name\}\}/g, COMPANY.name);
}
