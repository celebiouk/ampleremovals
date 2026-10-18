/**
 * POST /api/admin/bookings/[id]/extra-charge — admin adds an on-site extra
 * directly (same reasons a driver can flag: item/stairs/distance/other), used
 * by both the web admin and the admin native app. Unlike a driver's submission
 * (which goes to job_extras as 'pending' for admin to approve), an admin
 * adding one IS the approval — it's created already-approved and invoiced +
 * sent to the customer immediately, no separate review step.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { calcAutoAmount, describeExtraCharge, type ExtraType } from "@/lib/extra-charge-pricing";
import { createAndSendExtraCharge } from "@/lib/bookings/extraCharge";
import { logError } from "@/lib/log-error";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as {
    extraType?: ExtraType;
    itemKey?: string; itemLabel?: string; quantity?: number;
    flights?: number; distanceMeters?: number;
    description?: string;
    amount: number;
  } | null;

  const extraType: ExtraType = body?.extraType ?? "other";
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ success: false, error: "Enter a valid amount" }, { status: 400 });
  }
  if (extraType === "other" && !(body?.description ?? "").trim()) {
    return NextResponse.json({ success: false, error: "Describe the charge" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: booking } = await supabase.from("bookings").select("id").eq("id", params.id).maybeSingle();
  if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

  const { data: settings } = await supabase
    .from("settings")
    .select("extra_item_rate, extra_stairs_rate_per_flight, extra_distance_free_meters, extra_distance_rate_per_10m")
    .eq("id", 1)
    .maybeSingle();
  const rates = {
    itemRate: Number(settings?.extra_item_rate ?? 15),
    stairsRatePerFlight: Number(settings?.extra_stairs_rate_per_flight ?? 10),
    distanceFreeMeters: Number(settings?.extra_distance_free_meters ?? 20),
    distanceRatePer10m: Number(settings?.extra_distance_rate_per_10m ?? 5),
  };

  const calcInput = {
    extraType, itemLabel: body?.itemLabel, quantity: body?.quantity, flights: body?.flights, distanceMeters: body?.distanceMeters,
  };
  const autoAmount = calcAutoAmount(calcInput, rates);
  const description = extraType === "other" ? (body!.description as string).trim() : describeExtraCharge(calcInput, rates);

  const { data: extra, error: insErr } = await supabase.from("job_extras").insert({
    booking_id: params.id, driver_id: null, description, amount, status: "approved", reviewed_at: new Date().toISOString(),
    extra_type: extraType, item_key: body?.itemKey ?? null, quantity: body?.quantity ?? null,
    flights: body?.flights ?? null, distance_meters: body?.distanceMeters ?? null, auto_amount: autoAmount,
  }).select("id").single();
  if (insErr || !extra) return NextResponse.json({ success: false, error: insErr?.message ?? "Failed to save" }, { status: 500 });

  await supabase.from("activity_log").insert({
    booking_id: params.id, action: `Admin added extra charge: ${description} (£${amount.toFixed(2)})`,
    metadata: { autoAmount }, performed_by: "admin",
  });

  try {
    const result = await createAndSendExtraCharge(supabase, extra.id);
    return NextResponse.json({ success: true, invoiced: true, invoice: result });
  } catch (err) {
    await logError({ message: `Admin-added extra-charge invoice/send failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { jobExtraId: extra.id } });
    return NextResponse.json({ success: true, invoiced: false, error: "Saved, but creating/sending the invoice failed — check it manually" });
  }
}
