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
import { VAN_SIZES } from "@/lib/crew";

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

  return NextResponse.json({ success: true });
}
