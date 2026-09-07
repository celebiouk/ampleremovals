/**
 * Item-based pricing helpers. Loads the editable config + per-item prices from
 * the DB (short-cached), and computes the item subtotal + mileage that feed the
 * quote engine. Falls back to code defaults if the DB is unavailable.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { geocodePostcode } from "@/lib/postcode";
import { drivingDistanceMiles } from "@/lib/google-maps";
import { DEFAULT_PRICING_CONFIG, DEFAULT_ITEM_PRICES, DEFAULT_CUSTOM_ITEM_PRICE } from "@/lib/pricing-defaults";

export interface PricingConfig {
  base_callout: number;
  free_miles: number;
  per_mile: number;
  premium_multiplier: number;
}

export interface Pricing {
  config: PricingConfig;
  items: Map<string, number>;
}

let cache: { at: number; value: Pricing } | null = null;
const TTL_MS = 60_000;

export async function loadPricing(supabase?: any): Promise<Pricing> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    const db = supabase ?? createAdminClient();
    const [{ data: cfg }, { data: rows }] = await Promise.all([
      db.from("pricing_config").select("*").eq("id", 1).maybeSingle(),
      db.from("item_prices").select("item_key, price"),
    ]);
    const config: PricingConfig = {
      base_callout: Number(cfg?.base_callout ?? DEFAULT_PRICING_CONFIG.base_callout),
      free_miles: Number(cfg?.free_miles ?? DEFAULT_PRICING_CONFIG.free_miles),
      per_mile: Number(cfg?.per_mile ?? DEFAULT_PRICING_CONFIG.per_mile),
      premium_multiplier: Number(cfg?.premium_multiplier ?? DEFAULT_PRICING_CONFIG.premium_multiplier),
    };
    const items = new Map<string, number>(Object.entries(DEFAULT_ITEM_PRICES));
    for (const r of (rows ?? []) as { item_key: string; price: number }[]) items.set(r.item_key, Number(r.price));
    const value = { config, items };
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return { config: { ...DEFAULT_PRICING_CONFIG }, items: new Map(Object.entries(DEFAULT_ITEM_PRICES)) };
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Sum of item prices × quantities. Custom / admin-catalogue items fall back to
 *  the default custom-item price so they still add to the total. */
export function priceInventory(inventory: unknown, items: Map<string, number>): number {
  if (!Array.isArray(inventory)) return 0;
  let sum = 0;
  for (const line of inventory) {
    const key = (line as any)?.key as string | undefined;
    const qty = Number((line as any)?.quantity) || 0;
    if (!key || qty <= 0) continue;
    const price = items.has(key)
      ? (items.get(key) as number)
      : (key.startsWith("custom:") || key.startsWith("catalog:") ? DEFAULT_CUSTOM_ITEM_PRICE : 0);
    sum += price * qty;
  }
  return round2(sum);
}

/** Charge for miles beyond the free radius. */
export function mileageCost(miles: number, config: PricingConfig): number {
  const extra = Math.max(0, (Number(miles) || 0) - config.free_miles);
  return round2(extra * config.per_mile);
}

/** Road miles between two UK postcodes. Uses Google driving distance first (the
 *  same real road distance the admin distance panel shows, so the quote and the
 *  panel agree); falls back to a straight-line × 1.3 estimate if Google is
 *  unavailable. Best effort — returns 0 if neither works. */
export async function milesBetweenPostcodes(a?: string | null, b?: string | null): Promise<number> {
  try {
    if (!a || !b) return 0;
    const road = await drivingDistanceMiles(a, b).catch(() => null);
    if (road != null && road > 0) return road;
    const [pa, pb] = await Promise.all([geocodePostcode(a), geocodePostcode(b)]);
    if (!pa || !pb) return 0;
    const R = 3958.8; // Earth radius in miles
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(pb.lat - pa.lat);
    const dLng = toRad(pb.lng - pa.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(pa.lat)) * Math.cos(toRad(pb.lat)) * Math.sin(dLng / 2) ** 2;
    const straight = 2 * R * Math.asin(Math.sqrt(h));
    return Math.round(straight * 1.3 * 10) / 10;
  } catch {
    return 0;
  }
}
