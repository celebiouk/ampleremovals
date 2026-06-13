/**
 * GET /api/admin/payroll/compliance — compliance tracking & tax reporting
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get all payslips
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select("worker_id, worker_type, gross_earnings, tips_total, status")
      .eq("status", "paid");

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Group by worker for compliance tracking
    const workerComplianceMap: Record<
      string,
      {
        worker_id: string;
        worker_type: string;
        total_gross: number;
        total_tips: number;
        payslip_count: number;
        estimated_tax: number;
        estimated_ni: number;
        compliance_status: "ok" | "warning" | "alert";
      }
    > = {};

    const TAX_THRESHOLD = 12570;
    const NI_THRESHOLD = 12570;
    const TAX_WARNING_THRESHOLD = 50270; // Basic rate limit
    const HIGH_EARNER_THRESHOLD = 100000; // High income threshold

    payslips?.forEach((p) => {
      if (!workerComplianceMap[p.worker_id]) {
        workerComplianceMap[p.worker_id] = {
          worker_id: p.worker_id,
          worker_type: p.worker_type,
          total_gross: 0,
          total_tips: 0,
          payslip_count: 0,
          estimated_tax: 0,
          estimated_ni: 0,
          compliance_status: "ok",
        };
      }

      const w = workerComplianceMap[p.worker_id];
      w.total_gross += p.gross_earnings;
      w.total_tips += p.tips_total;
      w.payslip_count += 1;

      const taxableIncome = Math.max(0, w.total_gross - TAX_THRESHOLD);
      w.estimated_tax = taxableIncome * 0.2;
      w.estimated_ni = Math.max(0, w.total_gross - NI_THRESHOLD) * 0.08;

      // Determine compliance status
      if (w.total_gross > HIGH_EARNER_THRESHOLD) {
        w.compliance_status = "alert"; // Needs tax planning
      } else if (w.total_gross > TAX_WARNING_THRESHOLD) {
        w.compliance_status = "warning"; // Higher tax bracket
      } else {
        w.compliance_status = "ok";
      }
    });

    // Calculate aggregates
    const complianceWorkers = Object.values(workerComplianceMap);
    const totalGross = complianceWorkers.reduce((sum, w) => sum + w.total_gross, 0);
    const totalTax = complianceWorkers.reduce((sum, w) => sum + w.estimated_tax, 0);
    const totalNI = complianceWorkers.reduce((sum, w) => sum + w.estimated_ni, 0);

    const stats = {
      total_workers: complianceWorkers.length,
      total_gross: totalGross,
      total_estimated_tax: totalTax,
      total_estimated_ni: totalNI,
      status_breakdown: {
        ok: complianceWorkers.filter((w) => w.compliance_status === "ok").length,
        warning: complianceWorkers.filter((w) => w.compliance_status === "warning")
          .length,
        alert: complianceWorkers.filter((w) => w.compliance_status === "alert").length,
      },
      high_earners: complianceWorkers
        .filter((w) => w.total_gross > HIGH_EARNER_THRESHOLD)
        .map((w) => ({
          worker_id: w.worker_id,
          total_gross: w.total_gross,
          estimated_tax: w.estimated_tax,
        })),
    };

    return NextResponse.json({
      success: true,
      compliance: {
        stats,
        worker_breakdown: complianceWorkers,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
