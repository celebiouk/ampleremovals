import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const resendFrom =
  process.env.RESEND_FROM_EMAIL ?? "Bookings - Ample Removals <bookings@ampleremovals.com>";

// Multiple admin emails for new booking notifications
// daniel@ampleremovals.com is the MAIN email - must receive ALL notifications
export const resendAdminEmails = [
  "daniel@ampleremovals.com",  // MAIN - receives everything
  "bookings@ampleremovals.com",
  "rita@ampleremovals.com",
];

// Single admin email for backwards compatibility
export const resendAdminEmail =
  process.env.RESEND_ADMIN_EMAIL ?? "ampleremovals@gmail.com";

/**
 * Send an email using Resend
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const { to, subject, html, from = resendFrom } = params;

  return await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}
