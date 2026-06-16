/**
 * GET/PATCH/DELETE /api/admin/porters/[id]
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("porters").select("*").eq("id", params.id).single();
  if (error || !data) return NextResponse.json({ success: false, error: "Porter not found" }, { status: 404 });
  return NextResponse.json({ success: true, porter: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("porters")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { error } = await supabase.from("porters").delete().eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
