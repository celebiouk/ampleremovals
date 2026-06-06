/**
 * Replaces {{variable}} placeholders in a template string.
 * Variable names are case-insensitive.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return variables[key] ?? variables[key.toLowerCase()] ?? `{{${key}}}`;
  });
}

/** Built-in template bodies for the 8 seeded automation rules. */
export const BUILT_IN_TEMPLATES = {
  customer_confirmation_email: {
    subject: "We've received your {{service}} request — Ref: {{ref}}",
    body: `Hi {{name}},

Thank you for choosing Ample Removals! We've received your {{service}} request (Ref: {{ref}}) and our team will be in touch within 2 hours to confirm the details.

If you have any questions in the meantime, please call us on {{company_phone}}.

Best regards,
Ample Removals`,
  },
  not_answered_followup: {
    subject: "We tried to reach you — Ref: {{ref}}",
    body: `Hi {{name}},

We tried to call you regarding your {{service}} request (Ref: {{ref}}) but couldn't get through.

Please call us back on {{company_phone}} or reply to this email and we'll sort everything for you straight away.

Best regards,
Ample Removals`,
  },
  deposit_invoice_reminder: {
    subject: "Friendly reminder: Your deposit invoice is awaiting payment — {{inv_number}}",
    body: `Hi {{name}},

Just a friendly reminder that your deposit invoice ({{inv_number}}) for £{{amount}} for your {{service}} (Ref: {{ref}}) is awaiting payment.

Please use the link below to pay securely:
{{payment_link}}

If you have any questions, please don't hesitate to contact us.

Best regards,
Ample Removals`,
  },
  job_confirmed: {
    subject: "Your {{service}} job is confirmed! — Ref: {{ref}}",
    body: `Hi {{name}},

Great news — your {{service}} job is confirmed!

Move date: {{date}}
Address: {{origin}}

Our team will be in touch 24 hours before to confirm arrival time.

Thank you for choosing Ample Removals!`,
  },
  day_before_reminder: {
    subject: "Reminder: Your {{service}} is tomorrow — Ref: {{ref}}",
    body: `Hi {{name}},

This is a friendly reminder that your {{service}} is scheduled for tomorrow, {{date}}.

Our team will arrive in the morning. If you need to reach us, please call {{company_phone}}.

See you tomorrow!
Ample Removals`,
  },
  review_request: {
    subject: "How did we do? — Ample Removals",
    body: `Hi {{name}},

We hope your {{service}} went smoothly! We would love to hear how we did.

Could you spare 2 minutes to leave us a review?
{{google_review_link}}

Your feedback means the world to us and helps other customers find us.

Thank you for choosing Ample Removals!`,
  },
  win_back: {
    subject: "We'd love another chance — Ample Removals",
    body: `Hi {{name}},

We noticed your {{service}} inquiry with us didn't progress. If you're still looking for help, we'd love a second chance.

Reply to this email or call us on {{company_phone}} and we'll sort everything for you.

Best regards,
Ample Removals`,
  },
};
