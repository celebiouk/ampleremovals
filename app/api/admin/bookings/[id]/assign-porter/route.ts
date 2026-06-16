/**
 * POST   /api/admin/bookings/[id]/assign-porter  { porterId }
 * DELETE /api/admin/bookings/[id]/assign-porter?porterId=...
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("booking_porter_assignments")
    .select("id, porter_id, day_rate, porter:porters(first_name, last_name, phone)")
    .eq("booking_id", params.id);
  return NextResponse.json({ success: true, assignments: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { porterId, dayRate } = await req.json().catch(() => ({}));
  if (!porterId) return NextResponse.json({ success: false, error: "porterId required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("booking_porter_assignments").insert({
    booking_id: params.id,
    porter_id: porterId,
    day_rate: dayRate ?? null,
  });
  if (error) {
    const msg = error.code === "23505" ? "Porter already assigned to this booking" : error.message;
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
  await supabase.from("activity_log").insert({
    booking_id: params.id, action: "Porter assigned", metadata: { porterId }, performed_by: "admin",
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const porterId = new URL(req.url).searchParams.get("porterId");
  if (!porterId) return NextResponse.json({ success: false, error: "porterId required" }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from("booking_porter_assignments").delete().eq("booking_id", params.id).eq("porter_id", porterId);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
