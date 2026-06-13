/**
 * GET /api/worker/tax-summary — get worker's tax summary (YTD)
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

    // Get YTD payslips (paid only)
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);

    const { data: payslips, error } = await supabase
      .from("payslips")
      .select("gross_earnings, tips_total, net_pay, created_at")
      .eq("worker_type", workerType)
      .eq("worker_id", workerId)
      .eq("status", "paid")
      .gte("created_at", yearStart.toISOString());

    if (error) {
      throw new Error(`Failed to fetch tax summary: ${error.message}`);
    }

    // Calculate YTD totals
    const ytdGross = payslips?.reduce((sum, p) => sum + p.gross_earnings, 0) || 0;
    const ytdTips = payslips?.reduce((sum, p) => sum + p.tips_total, 0) || 0;
    const ytdNet = payslips?.reduce((sum, p) => sum + p.net_pay, 0) || 0;

    // UK tax threshold 2024/25: £12,570
    // Basic rate (20%): £12,570 - £50,270
    const TAX_THRESHOLD = 12570;
    const BASIC_RATE = 0.2;

    const taxableIncome = Math.max(0, ytdGross - TAX_THRESHOLD);
    const estimatedTax = taxableIncome * BASIC_RATE;

    // National Insurance threshold 2024/25: £12,570
    // Basic rate (8%): on earnings above threshold
    const NI_THRESHOLD = 12570;
    const NI_RATE = 0.08;
    const estimatedNI = Math.max(0, ytdGross - NI_THRESHOLD) * NI_RATE;

    return NextResponse.json({
      success: true,
      tax_summary: {
        year: currentYear,
        ytd_gross: ytdGross,
        ytd_tips: ytdTips,
        ytd_net: ytdNet,
        payslip_count: payslips?.length || 0,
        estimated_tax: estimatedTax,
        estimated_ni: estimatedNI,
        estimated_total_deductions: estimatedTax + estimatedNI,
        tax_threshold: TAX_THRESHOLD,
        ni_threshold: NI_THRESHOLD,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
