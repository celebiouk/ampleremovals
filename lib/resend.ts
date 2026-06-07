import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const resendFrom =
  process.env.RESEND_FROM_EMAIL ?? "Bookings - Ample Removals <bookings@ampleremovals.com>";

// Multiple admin emails for new booking notifications
export const resendAdminEmails = [
  "bookings@ampleremovals.com",
  "rita@ampleremovals.com",
  "amanda@ampleremovals.com",
];

// Single admin email for backwards compatibility
export const resendAdminEmail =
  process.env.RESEND_ADMIN_EMAIL ?? "ampleremovals@gmail.com";
