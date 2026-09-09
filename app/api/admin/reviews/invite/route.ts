import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { resend, resendFrom } from "@/lib/resend";
import { COMPANY_PHONE } from "@/lib/constants";

export const runtime = "nodejs";

const InviteSchema = z.object({
  name: z.string().trim().min(2, "Enter their name"),
  email: z.string().trim().email("Enter a valid email"),
  /** Which service they used, e.g. "Removals", "Man & Van" — makes the email
   *  read as a genuine post-service thank-you rather than a generic note, which
   *  is what Trustpilot needs to recognise this as a real completed customer. */
  service: z.string().trim().max(60).optional(),
  confirm: z.boolean().optional(),
});

const DUPLICATE_WINDOW_DAYS = 30;

function reviewInviteEmailHtml(name: string, company: string, service?: string): string {
  const first = name.split(" ")[0];
  const serviceLine = service
    ? `Thank you for using our <strong>${service}</strong> service — it was a pleasure helping with your move.`
    : `Thank you for choosing ${company} — it was a pleasure helping with your move.`;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Thank you, ${first}!</h1>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
      <p style="color:#1e293b;">${serviceLine}</p>
      <p style="color:#475569;line-height:1.6;">We hope everything went smoothly. If anything at all needs sorting out, just call us on <a href="tel:+443335772070" style="color:#6b21a8;">${COMPANY_PHONE}</a> and we'll put it right straight away.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Thanks again for your business — we're glad you chose ${company}.</p>
    </div>
  </div>`;
}

/**
 * POST /api/admin/reviews/invite — admin manually invites someone (by name +
 * email, no booking required) for a review. Sends them a short thank-you email
 * with Trustpilot's invite address BCC'd — the same mechanism as the automatic
 * job-completion trigger (see lib/rating-request.ts), but fireable on demand for
 * anyone: a customer who slipped through, a phone booking, a favour, etc.
 * Trustpilot emails the review invite separately, in its own time.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!process.env.TRUSTPILOT_INVITE_EMAIL) {
    return NextResponse.json({ success: false, error: "Trustpilot isn't configured yet (TRUSTPILOT_INVITE_EMAIL is missing)." }, { status: 503 });
  }

  const parsed = InviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { name, email, service, confirm } = parsed.data;
  const supabase = createAdminClient();

  // Soft warning, not a block: if this email was invited recently, tell the
  // admin and let them decide — a second call with confirm:true sends anyway.
  if (!confirm) {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("review_invites")
      .select("created_at")
      .eq("email", email)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent) {
      return NextResponse.json(
        { success: false, warning: true, lastInvitedAt: recent.created_at, error: `${email} was already invited on ${new Date(recent.created_at).toLocaleDateString("en-GB")}.` },
        { status: 409 }
      );
    }
  }

  const { data: settings } = await supabase.from("settings").select("company_name").eq("id", 1).maybeSingle();
  const company = settings?.company_name || "Ample Removals";

  try {
    await resend.emails.send({
      from: resendFrom,
      to: email,
      bcc: [process.env.TRUSTPILOT_INVITE_EMAIL],
      subject: service ? `Thank you for your ${service} with ${company}` : `Thank you for choosing ${company}`,
      html: reviewInviteEmailHtml(name, company, service),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Couldn't send the email." }, { status: 500 });
  }

  await supabase.from("review_invites").insert({ name, email, service: service || null, invited_by: auth.userId });

  return NextResponse.json({ success: true });
}

/** GET /api/admin/reviews/invite — recent manual invites, newest first. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("id, name, email, service, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ success: false, error: "Couldn't load invites." }, { status: 500 });
  return NextResponse.json({ success: true, invites: data ?? [] });
}
