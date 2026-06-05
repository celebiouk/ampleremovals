import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const resendFrom =
  process.env.RESEND_FROM_EMAIL ?? "bookings@yourcompany.com";
export const resendAdminEmail =
  process.env.RESEND_ADMIN_EMAIL ?? "admin@yourcompany.com";
