/**
 * GET /api/admin/payroll/workers/[id]/report — worker-specific earnings report
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const workerId = params.id;

    // Get all payslips for this worker
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        worker_type,
        gross_earnings,
        tips_total,
        net_pay,
        status,
        created_at,
        pay_runs(reference, period_start, period_end)
      `
      )
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    if (!payslips || payslips.length === 0) {
      return NextResponse.json({
        success: true,
        worker_id: workerId,
        report: null,
      });
    }

    // Calculate totals
    const totalGross = payslips.reduce((sum, p) => sum + p.gross_earnings, 0);
    const totalTips = payslips.reduce((sum, p) => sum + p.tips_total, 0);
    const totalNet = payslips.reduce((sum, p) => sum + p.net_pay, 0);
    const paidCount = payslips.filter((p) => p.status === "paid").length;
    const pendingCount = payslips.filter((p) => p.status === "pending").length;

    // Calculate tax estimates
    const TAX_THRESHOLD = 12570;
    const NI_THRESHOLD = 12570;
    const taxableIncome = Math.max(0, totalGross - TAX_THRESHOLD);
    const estimatedTax = taxableIncome * 0.2;
    const estimatedNI = Math.max(0, totalGross - NI_THRESHOLD) * 0.08;

    // Calculate average
    const averagePayslip = totalNet / payslips.length;

    // Monthly breakdown
    const monthlyData: Record<string, { gross: number; net: number; count: number }> = {};
    payslips.forEach((p) => {
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
      worker_id: workerId,
      worker_type: payslips[0].worker_type,
      report: {
        payslip_count: payslips.length,
        paid_count: paidCount,
        pending_count: pendingCount,
        total_gross: totalGross,
        total_tips: totalTips,
        total_net: totalNet,
        average_payslip: averagePayslip,
        estimated_tax: estimatedTax,
        estimated_ni: estimatedNI,
        estimated_total_deductions: estimatedTax + estimatedNI,
        payslips: payslips,
        monthly_breakdown: monthlyData,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
