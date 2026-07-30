import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** PATCH /api/admin/catalog/[id] — rename or show/hide. Body: { label?, active? }. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  let body: { label?: string; active?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 }); }

  const patch: Record<string, unknown> = {};
  if (typeof body.label === "string" && body.label.trim()) patch.label = body.label.trim();
  if (typeof body.active === "boolean") patch.active = body.active;
  if (!Object.keys(patch).length) return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("catalog_items").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: "Update failed." }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** DELETE /api/admin/catalog/[id] — remove an admin-added item. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { error } = await supabase.from("catalog_items").delete().eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: "Delete failed." }, { status: 500 });
  return NextResponse.json({ success: true });
}
