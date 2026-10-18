/**
 * /api/drivers/jobs/[bookingId]/charges — driver adds an on-site extra charge to a
 * job (POST, goes to admin as 'pending') or lists this job's extras (GET).
 *
 * The driver app sends a structured reason (item/stairs/distance/other) plus
 * whatever quantity/flights/distance applies; the server — not the client —
 * is the source of truth for `auto_amount`, computed from the current admin
 * rates, so a stale app build can't under/over-charge. The driver's own
 * `amount` (which may equal or override the auto figure) is what's actually
 * billed once approved.
 */
import { NextResponse } from "next/server";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { calcAutoAmount, describeExtraCharge, type ExtraType } from "@/lib/extra-charge-pricing";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const b = await req.json().catch(() => null) as {
      extraType?: ExtraType;
      itemKey?: string; itemLabel?: string; quantity?: number;
      flights?: number; distanceMeters?: number;
      description?: string; // only used for extraType "other"
      amount: number;
    } | null;

    const extraType: ExtraType = b?.extraType ?? "other";
    const amount = Number(b?.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ success: false, error: "Enter a valid amount" }, { status: 400 });
    }
    if (extraType === "other" && !(b?.description ?? "").trim()) {
      return NextResponse.json({ success: false, error: "Describe the charge" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }

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
      extraType, itemLabel: b?.itemLabel, quantity: b?.quantity, flights: b?.flights, distanceMeters: b?.distanceMeters,
    };
    const autoAmount = calcAutoAmount(calcInput, rates);
    const description = extraType === "other" ? (b!.description as string).trim() : describeExtraCharge(calcInput, rates);

    const { data, error } = await supabase.from("job_extras").insert({
      booking_id: params.bookingId, driver_id: auth.driver.id, description, amount, status: "pending",
      extra_type: extraType, item_key: b?.itemKey ?? null, quantity: b?.quantity ?? null,
      flights: b?.flights ?? null, distance_meters: b?.distanceMeters ?? null, auto_amount: autoAmount,
    }).select("id").single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    await supabase.from("activity_log").insert({
      booking_id: params.bookingId, action: `Driver added extra charge: ${description} (£${amount.toFixed(2)}) — pending approval`,
      metadata: { driver_id: auth.driver.id, autoAmount }, performed_by: "driver",
    });
    return NextResponse.json({ success: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }
    const { data } = await supabase.from("job_extras").select("*").eq("booking_id", params.bookingId).order("created_at", { ascending: false });
    return NextResponse.json({ success: true, extras: data ?? [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
