import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Admin can add/hide items at any time — never serve a cached copy of this read.
// (dynamic alone doesn't stop Next.js caching the underlying supabase fetch.)
export const fetchCache = "force-no-store";

/**
 * GET /api/catalog — the admin-added inventory items (active only) that the
 * public booking wizard shows alongside the built-in catalog. Each item gets a
 * stable `catalog:<id>` key so it stores like any other inventory selection.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("catalog_items")
      .select("id, label, category")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    const items = (data ?? []).map((i) => ({ key: `catalog:${i.id}`, label: i.label, category: i.category }));
    return NextResponse.json({ success: true, items });
  } catch {
    // Never break the wizard over a catalog read.
    return NextResponse.json({ success: true, items: [] });
  }
}
