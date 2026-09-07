import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { loadPricing, priceInventory, mileageCost, milesBetweenPostcodes } from "@/lib/pricing";
import { buildQuote } from "@/lib/quote-engine";
import { depositFor } from "@/lib/deposit";

export const runtime = "nodejs";

/**
 * POST /api/admin/quote/preview
 * Admin-only. Computes the SAME system-generated quote the customer would see —
 * Standard and Premium totals — from the current wizard values, so the person
 * filling a lead in on a call can see the suggested price as guidance before they
 * decide what to actually charge. Purely a read/estimate: it persists nothing.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: {
    bedrooms?: string | null;
    inventory?: unknown;
    packingHours?: number;
    packingMen?: number;
    dismantleCount?: number;
    assembleCount?: number;
    wantsEotCleaning?: boolean;
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
      packingHours: body.packingHours ?? 0,
      packingMen: body.packingMen ?? 1,
      dismantleCount: body.dismantleCount ?? 0,
      assembleCount: body.assembleCount ?? 0,
      eotCleaning: Boolean(body.wantsEotCleaning),
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
      standardDeposit: quote.depositAmount,
      premiumTotal,
      premiumDeposit: depositFor(premiumTotal),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
