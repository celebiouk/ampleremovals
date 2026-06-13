/**
 * GET /api/admin/payroll/reports — advanced payroll reports
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const workerType = searchParams.get("worker_type") || "driver";

    // Get all payslips for worker type
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        worker_id,
        gross_earnings,
        tips_total,
        net_pay,
        status,
        created_at,
        pay_runs(reference)
      `
      )
      .eq("worker_type", workerType)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Group by worker
    const workerData: Record<
      string,
      {
        worker_id: string;
        payslip_count: number;
        total_gross: number;
        total_tips: number;
        total_net: number;
        status_breakdown: Record<string, number>;
      }
    > = {};

    payslips?.forEach((p) => {
      if (!workerData[p.worker_id]) {
        workerData[p.worker_id] = {
          worker_id: p.worker_id,
          payslip_count: 0,
          total_gross: 0,
          total_tips: 0,
          total_net: 0,
          status_breakdown: {},
        };
      }

      const w = workerData[p.worker_id];
      w.payslip_count += 1;
      w.total_gross += p.gross_earnings;
      w.total_tips += p.tips_total;
      w.total_net += p.net_pay;
      w.status_breakdown[p.status] = (w.status_breakdown[p.status] || 0) + 1;
    });

    // Calculate compliance data
    const complianceReport = Object.values(workerData).map((w) => {
      const TAX_THRESHOLD = 12570;
      const NI_THRESHOLD = 12570;
      const taxableIncome = Math.max(0, w.total_gross - TAX_THRESHOLD);
      const estimatedTax = taxableIncome * 0.2;
      const estimatedNI = Math.max(0, w.total_gross - NI_THRESHOLD) * 0.08;

      return {
        worker_id: w.worker_id,
        payslip_count: w.payslip_count,
        total_gross: w.total_gross,
        total_tips: w.total_tips,
        total_net: w.total_net,
        estimated_tax: estimatedTax,
        estimated_ni: estimatedNI,
        status_breakdown: w.status_breakdown,
      };
    });

    return NextResponse.json({
      success: true,
      worker_type: workerType,
      report: {
        total_workers: Object.keys(workerData).length,
        total_gross: complianceReport.reduce((sum, r) => sum + r.total_gross, 0),
        total_tips: complianceReport.reduce((sum, r) => sum + r.total_tips, 0),
        total_net: complianceReport.reduce((sum, r) => sum + r.total_net, 0),
        estimated_total_tax: complianceReport.reduce((sum, r) => sum + r.estimated_tax, 0),
        estimated_total_ni: complianceReport.reduce((sum, r) => sum + r.estimated_ni, 0),
        worker_breakdown: complianceReport,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
