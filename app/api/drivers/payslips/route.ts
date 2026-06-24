/**
 * GET /api/drivers/payslips — the signed-in driver's payslips (amounts in pounds).
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("payslips")
      .select("id, gross_earnings, tips_total, net_pay, status, created_at, pay_runs(reference)")
      .eq("worker_type", "driver")
      .eq("worker_id", auth.driver.id)
      .order("created_at", { ascending: false })
      .limit(100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payslips = (data ?? []).map((p: any) => ({
      id: p.id,
      reference: p.pay_runs?.reference ?? "",
      gross_earnings: (p.gross_earnings ?? 0) / 100, // stored in pence
      tips_total: (p.tips_total ?? 0) / 100,
      net_pay: (p.net_pay ?? 0) / 100,
      status: p.status,
      created_at: p.created_at,
    }));
    return NextResponse.json({ success: true, payslips });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
