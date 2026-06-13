/**
 * GET /api/admin/payroll/workers/[id]/p45 — year-end statement PDF for a worker
 *
 * Aggregates the worker's payslips for a tax year and renders a P45-style
 * year-end earnings & estimated-tax statement. `?year=2026` optional (default
 * current year); `?type=driver|cleaner` optional (defaults to driver).
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateYearEndPDF } from "@/lib/pdf/generate-year-end-pdf";

const TAX_THRESHOLD = 12570;
const NI_THRESHOLD = 12570;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year") || String(new Date().getFullYear());
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const supabase = createAdminClient();

    // Resolve worker type: honour ?type, else detect from this worker's payslips.
    let workerType = url.searchParams.get("type");
    if (workerType !== "driver" && workerType !== "cleaner") {
      const { data: anyPs } = await supabase
        .from("payslips")
        .select("worker_type")
        .eq("worker_id", params.id)
        .limit(1)
        .maybeSingle();
      workerType = anyPs?.worker_type === "cleaner" ? "cleaner" : "driver";
    }

    // Worker name
    const table = workerType === "cleaner" ? "cleaners" : "drivers";
    const { data: worker } = await supabase
      .from(table)
      .select("first_name, last_name")
      .eq("id", params.id)
      .single();

    const workerName = worker
      ? [worker.first_name, worker.last_name].filter(Boolean).join(" ").trim()
      : `${workerType} ${params.id.slice(0, 8)}`;

    // Payslips for this worker in the tax year (paid + pending), joined to the run period.
    const { data: rows, error } = await supabase
      .from("payslips")
      .select(
        `gross_earnings, tips_total, net_pay, status,
         pay_runs!inner(reference, period_start, period_end)`
      )
      .eq("worker_id", params.id)
      .eq("worker_type", workerType)
      .gte("pay_runs.period_end", yearStart)
      .lte("pay_runs.period_start", yearEnd)
      .order("pay_runs(period_start)", { ascending: true });

    if (error) throw new Error(error.message);

    const payslips = (rows ?? []).map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const run = p.pay_runs as any;
      const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB");
      return {
        period: run ? `${fmt(run.period_start)} – ${fmt(run.period_end)}` : "—",
        reference: run?.reference ?? "—",
        gross: Number(p.gross_earnings) || 0,
        tips: Number(p.tips_total) || 0,
        net: Number(p.net_pay) || 0,
        status: p.status,
      };
    });

    const totalGross = payslips.reduce((s, p) => s + p.gross, 0);
    const totalTips = payslips.reduce((s, p) => s + p.tips, 0);
    const totalNet = payslips.reduce((s, p) => s + p.net, 0);
    const estimatedTax = Math.max(0, totalGross - TAX_THRESHOLD) * 0.2;
    const estimatedNI = Math.max(0, totalGross - NI_THRESHOLD) * 0.08;

    const pdf = await generateYearEndPDF({
      companyName: "Ample Removals",
      taxYear: year,
      workerName,
      workerType,
      totalGross,
      totalTips,
      totalNet,
      estimatedTax,
      estimatedNI,
      payslips,
      generatedAt: new Date().toLocaleDateString("en-GB"),
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="year-end-${year}-${workerName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
