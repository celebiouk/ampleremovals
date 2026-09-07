/**
 * PATCH /api/admin/bookings/[id]/crew  { crew_men, van_count, van_size, crew_blurb }
 * Lets admin adjust the team & vehicle on a booking at any time — e.g. after a
 * survey/review it's clear one van won't do the job or an extra mover is needed.
 * Updates the quote's crew fields (shown on the customer quote + PDF/email).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { VAN_SIZES, resolveCrew } from "@/lib/crew";
import { resend, resendFrom } from "@/lib/resend";
import { generateQuoteConfirmToken } from "@/lib/tokens";

export const runtime = "nodejs";

const schema = z.object({
  crew_men: z.number().int().min(1).max(10),
  van_count: z.number().int().min(1).max(6),
  van_size: z.enum(VAN_SIZES.map((v) => v.key) as [string, ...string[]]),
  crew_blurb: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid crew" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      quote_crew_men: parsed.data.crew_men,
      quote_van_count: parsed.data.van_count,
      quote_van_size: parsed.data.van_size,
      quote_crew_blurb: parsed.data.crew_blurb ?? null,
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ success: false, error: "Couldn't update the team." }, { status: 500 });

  await supabase.from("activity_log").insert({
    booking_id: params.id,
    action: `Team updated by admin — ${parsed.data.crew_men} men, ${parsed.data.van_count} × ${parsed.data.van_size}`,
    performed_by: auth.userId ?? "admin",
  });

  // Tell the customer their team & vehicle has changed — EMAIL ONLY (no SMS/WhatsApp).
  try {
    const { data: b } = await supabase
      .from("bookings")
      .select("reference, customer:customers!inner(full_name, email)")
      .eq("id", params.id)
      .single();
    const customer = Array.isArray(b?.customer) ? b!.customer[0] : b?.customer;
    if (customer?.email) {
      const crew = resolveCrew({
        quote_crew_men: parsed.data.crew_men,
        quote_van_count: parsed.data.van_count,
        quote_van_size: parsed.data.van_size,
        quote_crew_blurb: parsed.data.crew_blurb ?? null,
      });
      const token = generateQuoteConfirmToken(params.id);
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";
      const link = token ? `${site}/quote/${params.id}/${token}` : site;
      const html = `
        <div style="font-family: Arial, sans-serif; color:#1e293b; max-width:600px; margin:0 auto;">
          <div style="background:#6b21a8; padding:24px; border-radius:12px 12px 0 0;"><h1 style="color:#fff; margin:0; font-size:22px;">Your moving team is confirmed</h1></div>
          <div style="background:#fff; padding:32px; border:1px solid #e2e8f0; border-top:0; border-radius:0 0 12px 12px;">
            <p style="font-size:16px;">Hi ${customer.full_name.split(" ")[0]},</p>
            <p style="font-size:16px; margin:16px 0;">We've set up the team & vehicle for your move:</p>
            <div style="background:#f5f3ff; border-left:4px solid #6b21a8; padding:16px; margin:16px 0; border-radius:4px;">
              <p style="margin:0 0 6px; font-size:15px; color:#6b21a8;"><strong>${crew.line}</strong></p>
              <p style="margin:0; font-size:14px; color:#475569; line-height:1.6;">${crew.blurb}</p>
            </div>
            <p style="text-align:center; margin:24px 0;"><a href="${link}" style="background:#16a34a; color:#fff; text-decoration:none; padding:14px 28px; border-radius:10px; font-weight:bold; font-size:16px; display:inline-block;">View my booking</a></p>
            <p style="font-size:14px; color:#64748b;">Any questions? Call us on 0333 577 2070. Ref: ${b!.reference}</p>
          </div>
        </div>`;
      await resend.emails.send({ from: resendFrom, to: customer.email, subject: `Your moving team is confirmed — ${b!.reference}`, html }).catch(() => {});
    }
  } catch { /* email is best-effort — never block the crew update */ }

  return NextResponse.json({ success: true });
}
