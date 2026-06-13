/**
 * GET /api/admin/payroll/year-end — year-end payroll summary & tax reports
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);
    const yearEnd = new Date(`${currentYear}-12-31`);

    // Get all payslips for the year
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        worker_id,
        worker_type,
        gross_earnings,
        tips_total,
        net_pay,
        status,
        created_at
      `
      )
      .gte("created_at", yearStart.toISOString())
      .lte("created_at", yearEnd.toISOString())
      .eq("status", "paid");

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Calculate year-end summary
    const totalGross = payslips?.reduce((sum, p) => sum + p.gross_earnings, 0) || 0;
    const totalTips = payslips?.reduce((sum, p) => sum + p.tips_total, 0) || 0;
    const totalNet = payslips?.reduce((sum, p) => sum + p.net_pay, 0) || 0;

    // Tax calculations (UK 2024/25)
    const TAX_THRESHOLD = 12570;
    const NI_THRESHOLD = 12570;
    const taxableIncome = Math.max(0, totalGross - TAX_THRESHOLD);
    const estimatedTax = taxableIncome * 0.2;
    const estimatedNI = Math.max(0, totalGross - NI_THRESHOLD) * 0.08;
    const totalDeductions = estimatedTax + estimatedNI;

    // Group by worker type
    const driverPayslips = payslips?.filter((p) => p.worker_type === "driver") || [];
    const cleanerPayslips = payslips?.filter((p) => p.worker_type === "cleaner") || [];

    const driverGross = driverPayslips.reduce((sum, p) => sum + p.gross_earnings, 0);
    const cleanerGross = cleanerPayslips.reduce((sum, p) => sum + p.gross_earnings, 0);

    // Monthly distribution
    const monthlyDistribution: Record<string, { gross: number; net: number; count: number }> = {};
    payslips?.forEach((p) => {
      const monthKey = new Date(p.created_at).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyDistribution[monthKey]) {
        monthlyDistribution[monthKey] = { gross: 0, net: 0, count: 0 };
      }
      monthlyDistribution[monthKey].gross += p.gross_earnings;
      monthlyDistribution[monthKey].net += p.net_pay;
      monthlyDistribution[monthKey].count += 1;
    });

    // Highest paying months
    const topMonths = Object.entries(monthlyDistribution)
      .sort(([, a], [, b]) => b.net - a.net)
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      year_end_summary: {
        year: currentYear,
        total_payslips: payslips?.length || 0,
        total_gross: totalGross,
        total_tips: totalTips,
        total_net: totalNet,
        estimated_tax: estimatedTax,
        estimated_ni: estimatedNI,
        total_deductions: totalDeductions,
        net_after_tax: totalNet - totalDeductions,
        worker_breakdown: {
          drivers: {
            payslips: driverPayslips.length,
            gross: driverGross,
          },
          cleaners: {
            payslips: cleanerPayslips.length,
            gross: cleanerGross,
          },
        },
        top_earning_months: topMonths.map(([month, data]) => ({
          month,
          gross: data.gross,
          net: data.net,
        })),
        monthly_distribution: monthlyDistribution,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
