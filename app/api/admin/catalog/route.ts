import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** GET /api/admin/catalog — all admin catalog items (active + hidden). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("catalog_items")
    .select("id, label, category, active, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return NextResponse.json({ success: true, items: data ?? [] });
}

/** POST /api/admin/catalog — add an item. Body: { label, category? }. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { label?: string; category?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 }); }
  const label = body.label?.trim();
  const category = body.category?.trim() || "More items";
  if (!label) return NextResponse.json({ success: false, error: "Item name is required." }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("catalog_items")
    .insert({ label, category })
    .select("id, label, category, active, created_at")
    .single();
  if (error || !data) return NextResponse.json({ success: false, error: "Couldn't add the item." }, { status: 500 });
  return NextResponse.json({ success: true, item: data });
}
