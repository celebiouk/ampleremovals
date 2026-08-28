/**
 * GET/PUT /api/admin/pricing — the editable item-based pricing:
 *  - config: base call-out, free miles, per-mile, premium multiplier
 *  - items:  a price per catalogue item (built-in catalogue, grouped by category)
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { INVENTORY_CATALOG } from "@/lib/inventory-catalog";
import { DEFAULT_ITEM_PRICES, DEFAULT_PRICING_CONFIG } from "@/lib/pricing-defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const [{ data: cfg }, { data: rows }] = await Promise.all([
    supabase.from("pricing_config").select("*").eq("id", 1).maybeSingle(),
    supabase.from("item_prices").select("item_key, price"),
  ]);
  const priceMap = new Map((rows ?? []).map((r: { item_key: string; price: number }) => [r.item_key, Number(r.price)]));
  const items: { key: string; label: string; category: string; price: number }[] = [];
  for (const cat of INVENTORY_CATALOG) {
    for (const it of cat.items) {
      items.push({ key: it.key, label: it.label, category: cat.category, price: priceMap.get(it.key) ?? DEFAULT_ITEM_PRICES[it.key] ?? 0 });
    }
  }
  const config = {
    base_callout: Number(cfg?.base_callout ?? DEFAULT_PRICING_CONFIG.base_callout),
    free_miles: Number(cfg?.free_miles ?? DEFAULT_PRICING_CONFIG.free_miles),
    per_mile: Number(cfg?.per_mile ?? DEFAULT_PRICING_CONFIG.per_mile),
    premium_multiplier: Number(cfg?.premium_multiplier ?? DEFAULT_PRICING_CONFIG.premium_multiplier),
  };
  return NextResponse.json({ success: true, config, items });
}

const schema = z.object({
  config: z.object({
    base_callout: z.number().min(0).max(100000),
    free_miles: z.number().min(0).max(1000),
    per_mile: z.number().min(0).max(1000),
    premium_multiplier: z.number().min(1).max(10),
  }),
  items: z.array(z.object({ key: z.string().min(1).max(120), price: z.number().min(0).max(100000) })).max(500),
});

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid pricing" }, { status: 400 });

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  await supabase.from("pricing_config").upsert({ id: 1, ...parsed.data.config, updated_at: now }, { onConflict: "id" });
  if (parsed.data.items.length) {
    await supabase.from("item_prices").upsert(
      parsed.data.items.map((i) => ({ item_key: i.key, price: i.price, updated_at: now })),
      { onConflict: "item_key" }
    );
  }
  return NextResponse.json({ success: true });
}
