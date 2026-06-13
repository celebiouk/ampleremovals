/**
 * GET /api/worker/tax-documents — worker's tax documents (P45, certificates, etc)
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

    // Determine worker type & ID
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, first_name, last_name, email")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id, first_name, last_name, email")
      .eq("user_id", userId)
      .single();

    if (!driver && !cleaner) {
      return NextResponse.json(
        { success: false, error: "Not a driver or cleaner" },
        { status: 403 }
      );
    }

    const worker = driver || cleaner;
    const workerType = driver ? "driver" : "cleaner";
    const workerId = worker.id;

    // Get all paid payslips for tax year (Jan 1 - now)
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
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Calculate YTD totals
    const ytdGross = payslips?.reduce((sum, p) => sum + p.gross_earnings, 0) || 0;
    const ytdTips = payslips?.reduce((sum, p) => sum + p.tips_total, 0) || 0;
    const ytdNet = payslips?.reduce((sum, p) => sum + p.net_pay, 0) || 0;

    // Tax calculations (UK 2024/25)
    const TAX_THRESHOLD = 12570;
    const NI_THRESHOLD = 12570;
    const taxableIncome = Math.max(0, ytdGross - TAX_THRESHOLD);
    const estimatedTax = taxableIncome * 0.2;
    const estimatedNI = Math.max(0, ytdGross - NI_THRESHOLD) * 0.08;

    // Generate available documents
    const documents = [
      {
        id: "p45",
        name: "P45 (End of Year Certificate)",
        description: "Tax year ending April 5, 2025",
        available: true,
        type: "pdf",
        generatedDate: new Date().toISOString(),
      },
      {
        id: "tax-certificate",
        name: "Tax Certificate",
        description: `Tax paid in ${currentYear}`,
        available: estimatedTax > 0,
        type: "pdf",
        generatedDate: new Date().toISOString(),
      },
      {
        id: "ni-certificate",
        name: "National Insurance Certificate",
        description: `NI contributions in ${currentYear}`,
        available: estimatedNI > 0,
        type: "pdf",
        generatedDate: new Date().toISOString(),
      },
      {
        id: "payslips-archive",
        name: "Payslips Archive",
        description: `All payslips for ${currentYear}`,
        available: payslips && payslips.length > 0,
        type: "pdf",
        generatedDate: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      worker: {
        name: `${worker.first_name} ${worker.last_name}`,
        email: worker.email,
        type: workerType,
      },
      tax_year: {
        year: currentYear,
        ytd_gross: ytdGross,
        ytd_tips: ytdTips,
        ytd_net: ytdNet,
        estimated_tax: estimatedTax,
        estimated_ni: estimatedNI,
        payslip_count: payslips?.length || 0,
      },
      available_documents: documents,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
