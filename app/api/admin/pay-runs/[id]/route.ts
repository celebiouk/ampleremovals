/**
 * GET /api/admin/pay-runs/[id] — get pay run detail with payslips
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { attachWorkerNames } from "@/lib/payroll-workers";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const { data: run, error } = await supabase
      .from("pay_runs")
      .select(
        `
        id,
        reference,
        period_start,
        period_end,
        status,
        notes,
        created_at,
        finalised_at,
        paid_at,
        payslips(
          id,
          worker_id,
          worker_type,
          gross_earnings,
          tips_total,
          adjustments_total,
          net_pay,
          status,
          paid_at,
          payment_method
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch pay run: ${error.message}`);
    }

    if (!run) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // Compute totals
    const payslips = run.payslips || [];
    const totals = {
      gross: payslips.reduce((sum, p) => sum + p.gross_earnings, 0),
      tips: payslips.reduce((sum, p) => sum + p.tips_total, 0),
      adjustments: payslips.reduce((sum, p) => sum + p.adjustments_total, 0),
      net: payslips.reduce((sum, p) => sum + p.net_pay, 0),
      pending: payslips.filter((p) => p.status === "pending").length,
      paid: payslips.filter((p) => p.status === "paid").length,
    };

    // Resolve worker display names (driver/cleaner) for each payslip.
    const payslipsWithNames = await attachWorkerNames(supabase, payslips);
    const runWithNames = { ...run, payslips: payslipsWithNames };

    return NextResponse.json({ success: true, data: { run: runWithNames, totals } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
