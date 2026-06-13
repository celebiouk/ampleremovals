/**
 * GET /api/admin/payroll/analytics — payroll analytics & metrics
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get all payslips (current year)
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);

    const { data: payslips, error: psError } = await supabase
      .from("payslips")
      .select(
        `
        id,
        worker_type,
        worker_id,
        gross_earnings,
        tips_total,
        net_pay,
        status,
        created_at,
        pay_runs(reference)
      `
      )
      .gte("created_at", yearStart.toISOString());

    if (psError) throw new Error(`Failed to fetch payslips: ${psError.message}`);

    // Get all pay runs
    const { data: runs, error: runsError } = await supabase
      .from("pay_runs")
      .select("id, reference, status, period_start, period_end, created_at")
      .gte("created_at", yearStart.toISOString());

    if (runsError) throw new Error(`Failed to fetch runs: ${runsError.message}`);

    // Calculate analytics
    const stats = {
      // Payslips
      total_payslips: payslips?.length || 0,
      total_gross: payslips?.reduce((sum, p) => sum + p.gross_earnings, 0) || 0,
      total_tips: payslips?.reduce((sum, p) => sum + p.tips_total, 0) || 0,
      total_net_paid: payslips
        ?.filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.net_pay, 0) || 0,
      total_net_pending: payslips
        ?.filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.net_pay, 0) || 0,

      // Pay runs
      total_pay_runs: runs?.length || 0,
      draft_runs: runs?.filter((r) => r.status === "draft").length || 0,
      finalised_runs: runs?.filter((r) => r.status === "finalised").length || 0,
      paid_runs: runs?.filter((r) => r.status === "paid").length || 0,

      // Worker breakdown
      drivers: payslips?.filter((p) => p.worker_type === "driver").length || 0,
      cleaners: payslips?.filter((p) => p.worker_type === "cleaner").length || 0,

      // Averages
      average_payslip: payslips && payslips.length > 0
        ? payslips.reduce((sum, p) => sum + p.net_pay, 0) / payslips.length
        : 0,

      // Year to date
      year: currentYear,
    };

    // Monthly breakdown
    const monthlyData: Record<string, { gross: number; net: number; count: number }> = {};
    payslips?.forEach((p) => {
      const month = new Date(p.created_at).toLocaleDateString("en-GB", {
        month: "2-digit",
        year: "numeric",
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { gross: 0, net: 0, count: 0 };
      }
      monthlyData[month].gross += p.gross_earnings;
      monthlyData[month].net += p.net_pay;
      monthlyData[month].count += 1;
    });

    return NextResponse.json({
      success: true,
      analytics: stats,
      monthly_breakdown: monthlyData,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
