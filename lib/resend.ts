import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";

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

/** Strip HTML to a short plaintext snippet for the inbox preview. */
function htmlToPreview(html: string): string {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * Log an outbound email against a customer so it shows in the WEB conversation
 * inbox next to their SMS/WhatsApp. Best-effort — never blocks or fails the send.
 * Recipients that aren't customers (admin/driver notifications) are skipped.
 */
async function logCustomerEmail(p: {
  to: string | string[]; subject: string; html: string; from: string;
  result: { data?: { id?: string } | null; error?: unknown };
}): Promise<void> {
  try {
    const recipients = (Array.isArray(p.to) ? p.to : [p.to]).map((e) => e.trim()).filter(Boolean);
    if (!recipients.length) return;
    const supabase = createAdminClient();
    const preview = htmlToPreview(p.html);
    const errObj = p.result?.error as { message?: string } | null | undefined;
    for (const email of recipients) {
      const { data: cust } = await supabase.from("customers").select("id").ilike("email", email).limit(1).maybeSingle();
      if (!cust) continue; // not a customer on file — skip (e.g. admin/driver email)
      const { data: convo } = await supabase.from("conversations").select("id").eq("customer_id", cust.id).limit(1).maybeSingle();
      await supabase.from("customer_emails").insert({
        customer_id: cust.id,
        conversation_id: convo?.id ?? null,
        to_email: email,
        from_email: p.from,
        subject: p.subject,
        preview,
        status: p.result?.error ? "failed" : "sent",
        resend_id: p.result?.data?.id ?? null,
        error_message: p.result?.error ? String(errObj?.message ?? errObj) : null,
      });
    }
  } catch (e) {
    console.warn("[resend] customer email log failed:", e);
  }
}

/**
 * Patch resend.emails.send ONCE so EVERY email — including the dozens of
 * automated flows that call resend.emails.send() directly (confirmations,
 * quotes, invoices, receipts, reminders…) — is logged to the customer inbox.
 * logCustomerEmail skips recipients that aren't customers (admin/driver mail).
 * Guarded so repeated module evaluation never double-wraps.
 */
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailsApi = resend.emails as any;
  if (!emailsApi.__ampleLogged) {
    const originalSend = resend.emails.send.bind(resend.emails);
    emailsApi.send = async (payload: Record<string, unknown>, options?: unknown) => {
      const result = await originalSend(payload as never, options as never);
      await logCustomerEmail({
        to: payload.to as string | string[],
        subject: (payload.subject as string) ?? "",
        html: (payload.html as string) ?? (payload.text as string) ?? "",
        from: (payload.from as string) ?? resendFrom,
        result: result as { data?: { id?: string } | null; error?: unknown },
      }).catch(() => {});
      return result;
    };
    emailsApi.__ampleLogged = true;
  }
}

/**
 * Send an email using Resend. Logging is handled centrally by the patch above,
 * so every email (via this helper or a direct resend.emails.send call) is
 * recorded against the customer and shown in the web conversation inbox.
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const { to, subject, html, from = resendFrom } = params;
  return await resend.emails.send({ from, to, subject, html });
}
