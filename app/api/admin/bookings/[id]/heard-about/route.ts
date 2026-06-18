/**
 * PATCH /api/admin/bookings/[id]/heard-about  { heard_about_us }
 * Lets admin set/correct how the customer heard about us (e.g. when it wasn't
 * captured at booking time).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const schema = z.object({ heard_about_us: z.string().max(100).nullable() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid value" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("bookings").update({ heard_about_us: parsed.data.heard_about_us || null }).eq("id", params.id);
  if (error) {
    return NextResponse.json({ success: false, error: "Run add_booking_attribution.sql first (heard_about_us column missing)." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
