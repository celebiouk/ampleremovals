/**
 * POST /api/admin/earnings/[id]/pay-extra — admin top-up on a driver_earnings
 * row, explicitly exempt from the daily-pay cap (see lib/daily-pay.ts). Used
 * when a porter/AnyVan driver's day-rate has already been met but admin wants
 * to pay more anyway (e.g. an exceptionally long or hard job).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null) as { amount?: number } | null;
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, error: "Enter a positive amount" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: earning } = await supabase.from("driver_earnings").select("gross_earnings, tip_amount, pay_extra_amount, booking_id, driver_id").eq("id", params.id).maybeSingle();
  if (!earning) return NextResponse.json({ success: false, error: "Earnings row not found" }, { status: 404 });

  const newExtra = Number(earning.pay_extra_amount || 0) + amount;
  const totalEarnings = Number(earning.gross_earnings || 0) + Number(earning.tip_amount || 0) + newExtra;

  const { error } = await supabase
    .from("driver_earnings")
    .update({ pay_extra_amount: newExtra, total_earnings: totalEarnings })
    .eq("id", params.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    booking_id: earning.booking_id,
    action: `Pay extra added: +£${amount.toFixed(2)}`,
    metadata: { earning_id: params.id, driver_id: earning.driver_id, amount },
    performed_by: "admin",
  });

  return NextResponse.json({ success: true, payExtraAmount: newExtra, totalEarnings });
}
