/**
 * POST /api/drivers/reset-password/request   { email }
 *
 * Driver "forgot password" — fully under our control. We mint the secure
 * recovery link via the Supabase admin API (the token flow stays Supabase's,
 * which is the safe part) but send OUR OWN branded email through Resend instead
 * of Supabase's default mailer.
 *
 * Public + service-role, so it's deliberately careful:
 *  - always returns { success: true } (never reveals whether an account exists)
 *  - only actually emails addresses that belong to a DRIVER
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";
import { logError } from "@/lib/log-error";

const RESET_REDIRECT_URL = "https://www.ampleremovals.com/drivers/reset-password/update";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  // Don't leak validation detail to a public endpoint; treat as a no-op success.
  if (!parsed.success) return NextResponse.json({ success: true });

  const email = parsed.data.email.trim().toLowerCase();
  const supabase = createAdminClient();

  try {
    // Only drivers may reset via this route.
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, full_name, email")
      .ilike("email", email)
      .maybeSingle();

    if (driver) {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: driver.email,
        options: { redirectTo: RESET_REDIRECT_URL },
      });

      const actionLink = data?.properties?.action_link;
      if (error || !actionLink) {
        await logError({ message: `Driver reset generateLink failed: ${error?.message ?? "no link"}`, metadata: { email } });
      } else {
        try {
          await sendEmail({
            to: driver.email,
            subject: "Reset your Ample Removals password",
            html: resetEmailHtml(driver.full_name ?? "there", actionLink),
          });
        } catch (mailErr) {
          await logError({ message: `Driver reset email send failed: ${mailErr instanceof Error ? mailErr.message : String(mailErr)}`, metadata: { email } });
        }
      }
    }
  } catch (err) {
    // Never surface internals; log and still return success.
    await logError({ message: `Driver reset request error: ${err instanceof Error ? err.message : String(err)}`, metadata: { email } });
  }

  return NextResponse.json({ success: true });
}

/** Branded reset email — purple/green Ample Removals look, email-client safe. */
function resetEmailHtml(name: string, actionLink: string): string {
  const firstName = name.split(" ")[0];
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#581c87 0%,#6b21a8 55%,#7e22ce 100%);padding:36px 32px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.14);border-radius:14px;padding:10px 18px;">
            <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.3px;">Ample Removals</span>
          </div>
          <h1 style="color:#ffffff;margin:20px 0 0;font-size:24px;font-weight:800;">Reset your password</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;">Hi ${firstName},</p>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.65;">
            We received a request to reset the password for your Ample Removals driver account.
            Tap the button below to choose a new one. This link expires in <strong>1 hour</strong>.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;"><tr><td align="center">
            <a href="${actionLink}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 36px;border-radius:12px;box-shadow:0 6px 16px rgba(22,163,74,0.32);">
              Set a new password
            </a>
          </td></tr></table>

          <p style="margin:0 0 8px;color:#64748b;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin:0 0 28px;word-break:break-all;">
            <a href="${actionLink}" style="color:#7e22ce;font-size:12px;text-decoration:underline;">${actionLink}</a>
          </p>

          <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
              Didn't ask for this? You can safely ignore this email — your password won't change until you
              create a new one. Need a hand? Call us on <strong style="color:#475569;">0333 577 2070</strong>.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0f172a;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© Ample Removals · Driver account security</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
