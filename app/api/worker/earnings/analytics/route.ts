/**
 * GET /api/worker/earnings/analytics — worker earnings analytics & insights
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Determine worker type
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!driver && !cleaner) {
      return NextResponse.json(
        { success: false, error: "Not a driver or cleaner" },
        { status: 403 }
      );
    }

    const workerId = driver?.id || cleaner?.id;
    const workerType = driver ? "driver" : "cleaner";
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);

    // Get all payslips for the year
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select("gross_earnings, tips_total, net_pay, status, created_at")
      .eq("worker_type", workerType)
      .eq("worker_id", workerId)
      .gte("created_at", yearStart.toISOString());

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Calculate analytics
    const ytdGross = payslips?.reduce((sum, p) => sum + p.gross_earnings, 0) || 0;
    const ytdTips = payslips?.reduce((sum, p) => sum + p.tips_total, 0) || 0;
    const ytdNet = payslips?.reduce((sum, p) => sum + p.net_pay, 0) || 0;
    const paidCount = payslips?.filter((p) => p.status === "paid").length || 0;
    const pendingCount = payslips?.filter((p) => p.status === "pending").length || 0;

    // Average per payslip
    const avgGross = payslips && payslips.length > 0 ? ytdGross / payslips.length : 0;
    const avgNet = payslips && payslips.length > 0 ? ytdNet / payslips.length : 0;

    // Monthly breakdown
    const monthlyData: Record<string, { gross: number; net: number; count: number }> = {};
    payslips?.forEach((p) => {
      const monthKey = new Date(p.created_at).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { gross: 0, net: 0, count: 0 };
      }
      monthlyData[monthKey].gross += p.gross_earnings;
      monthlyData[monthKey].net += p.net_pay;
      monthlyData[monthKey].count += 1;
    });

    // Best and worst months
    const sortedMonths = Object.entries(monthlyData).sort(
      ([, a], [, b]) => b.gross - a.gross
    );
    const bestMonth = sortedMonths[0];
    const worstMonth = sortedMonths[sortedMonths.length - 1];

    // Trend (compare last month to previous month)
    const monthKeys = Object.keys(monthlyData).sort();
    const trend =
      monthKeys.length >= 2
        ? ((monthlyData[monthKeys[monthKeys.length - 1]].gross -
            monthlyData[monthKeys[monthKeys.length - 2]].gross) /
            monthlyData[monthKeys[monthKeys.length - 2]].gross) *
          100
        : 0;

    return NextResponse.json({
      success: true,
      earnings_analytics: {
        year: currentYear,
        ytd_gross,
        ytd_tips,
        ytd_net,
        payslip_count: payslips?.length || 0,
        paid_count: paidCount,
        pending_count: pendingCount,
        average_gross: avgGross,
        average_net: avgNet,
        best_month: bestMonth
          ? { month: bestMonth[0], gross: bestMonth[1].gross }
          : null,
        worst_month: worstMonth
          ? { month: worstMonth[0], gross: worstMonth[1].gross }
          : null,
        trend_percentage: trend,
        monthly_breakdown: monthlyData,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
