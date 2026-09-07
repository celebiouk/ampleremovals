import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** GET /api/admin/catalog — admin catalog items + the hidden base-item keys. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const [{ data }, { data: settings }] = await Promise.all([
    supabase
      .from("catalog_items")
      .select("id, label, category, active, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("settings").select("hidden_item_keys").eq("id", 1).maybeSingle(),
  ]);
  const hiddenKeys = Array.isArray(settings?.hidden_item_keys) ? (settings!.hidden_item_keys as string[]) : [];
  return NextResponse.json({ success: true, items: data ?? [], hiddenKeys });
}

/**
 * PATCH /api/admin/catalog — set which BUILT-IN catalogue items customers see.
 * Body: { hiddenKeys: string[] } (the full replacement set). Applies to every
 * booking flow.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  let body: { hiddenKeys?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 }); }
  const hiddenKeys = Array.isArray(body.hiddenKeys) ? body.hiddenKeys.filter((k): k is string => typeof k === "string") : [];
  const supabase = createAdminClient();
  const { error } = await supabase.from("settings").update({ hidden_item_keys: hiddenKeys }).eq("id", 1);
  if (error) return NextResponse.json({ success: false, error: "Couldn't save visibility." }, { status: 500 });
  return NextResponse.json({ success: true, hiddenKeys });
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
