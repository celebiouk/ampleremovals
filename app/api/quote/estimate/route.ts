import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { loadPricing, priceInventory, mileageCost, milesBetweenPostcodes } from "@/lib/pricing";
import { buildQuote } from "@/lib/quote-engine";
import { depositFor } from "@/lib/deposit";

export const runtime = "nodejs";

/**
 * POST /api/quote/estimate — PUBLIC live quote for the Meta-ad landing wizard.
 * Takes just bedrooms + key items + the two postcodes and returns the Standard &
 * Premium totals (and 25% deposit) so the customer sees the price update instantly
 * as they edit. Distance uses the free postcodes.io geocode — no paid address
 * lookup. Estimate only; nothing is persisted here.
 */
export async function POST(req: NextRequest) {
  let body: {
    bedrooms?: string | null;
    inventory?: unknown;
    originPostcode?: string | null;
    destinationPostcode?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const inventory = Array.isArray(body.inventory) ? body.inventory : [];
    const { config: pricingCfg, items: itemPrices } = await loadPricing(supabase);
    const itemsSubtotal = priceInventory(inventory, itemPrices);
    const miles = await milesBetweenPostcodes(body.originPostcode, body.destinationPostcode);
    const mCost = mileageCost(miles, pricingCfg);

    const quote = buildQuote({
      bedrooms: body.bedrooms,
      baseCallout: pricingCfg.base_callout,
      itemsSubtotal,
      itemCount: inventory.reduce((n: number, i: { quantity?: number }) => n + (Number(i?.quantity) || 0), 0),
      mileageMiles: miles,
      mileageCost: mCost,
    });

    const standardTotal = quote.total;
    const premiumTotal = Math.round(standardTotal * pricingCfg.premium_multiplier * 100) / 100;

    return NextResponse.json({
      success: true,
      miles,
      standardTotal,
      premiumTotal,
      deposit: depositFor(standardTotal),
      premiumMultiplier: pricingCfg.premium_multiplier,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Couldn't estimate right now." },
      { status: 500 }
    );
  }
}
