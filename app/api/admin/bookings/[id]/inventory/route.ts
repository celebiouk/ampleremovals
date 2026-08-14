/**
 * PATCH /api/admin/bookings/[id]/inventory  { inventory: InventorySelection[] }
 * Lets an admin edit a booking's item list at any time — e.g. after the survey
 * is "complete", the customer remembers more items to collect. Overwrites the
 * booking's inventory with the supplied list and records it in the activity log.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const itemSchema = z.object({
  key: z.string().min(1).max(120),
  label: z.string().trim().min(1).max(160),
  variant: z.string().max(120).optional(),
  quantity: z.number().int().min(1).max(999),
});

const schema = z.object({ inventory: z.array(itemSchema).max(500) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid inventory" }, { status: 400 });
  }

  // Normalise: drop the variant field when empty so the stored shape stays clean.
  const inventory = parsed.data.inventory.map((i) => ({
    key: i.key,
    label: i.label,
    quantity: i.quantity,
    ...(i.variant ? { variant: i.variant } : {}),
  }));

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ inventory })
    .eq("id", params.id)
    .select("id, customer_id")
    .single();

  if (error || !booking) {
    return NextResponse.json({ success: false, error: "Couldn't update the inventory." }, { status: 500 });
  }

  const totalItems = inventory.reduce((n, i) => n + i.quantity, 0);
  await supabase.from("activity_log").insert({
    booking_id: params.id,
    action: `Inventory updated by admin — ${inventory.length} line${inventory.length === 1 ? "" : "s"}, ${totalItems} item${totalItems === 1 ? "" : "s"}`,
    metadata: { lines: inventory.length, totalItems },
    performed_by: auth.userId ?? "admin",
  });

  return NextResponse.json({ success: true, inventory });
}
