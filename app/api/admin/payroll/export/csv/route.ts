/**
 * GET /api/admin/payroll/export/csv — export payroll data as CSV
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

function generateCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.map((h) => `"${h}"`).join(",");
  const bodyLines = rows.map((row) =>
    row.map((cell) => {
      if (typeof cell === "number") return cell;
      return `"${String(cell).replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headerLine, ...bodyLines].join("\n");
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "payslips"; // payslips, workers, compliance

    if (type === "payslips") {
      // Export all payslips
      const { data: payslips, error } = await supabase
        .from("payslips")
        .select("*")
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw new Error(`Failed to fetch payslips: ${error.message}`);

      const headers = [
        "ID",
        "Worker Type",
        "Worker ID",
        "Gross",
        "Tips",
        "Net",
        "Status",
        "Paid Date",
      ];
      const rows = payslips?.map((p) => [
        p.id,
        p.worker_type,
        p.worker_id,
        (p.gross_earnings / 100).toFixed(2),
        (p.tips_total / 100).toFixed(2),
        (p.net_pay / 100).toFixed(2),
        p.status,
        new Date(p.paid_at).toLocaleDateString("en-GB"),
      ]) || [];

      const csv = generateCSV(headers, rows);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="payroll-payslips-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else if (type === "compliance") {
      // Export compliance report
      const { data: payslips, error } = await supabase
        .from("payslips")
        .select("worker_id, worker_type, gross_earnings, tips_total, status")
        .eq("status", "paid");

      if (error) throw new Error(`Failed to fetch payslips: ${error.message}`);

      const workerMap: Record<string, any> = {};

      payslips?.forEach((p) => {
        if (!workerMap[p.worker_id]) {
          workerMap[p.worker_id] = {
            worker_id: p.worker_id,
            worker_type: p.worker_type,
            total_gross: 0,
            total_tips: 0,
            count: 0,
          };
        }
        workerMap[p.worker_id].total_gross += p.gross_earnings;
        workerMap[p.worker_id].total_tips += p.tips_total;
        workerMap[p.worker_id].count += 1;
      });

      const headers = [
        "Worker ID",
        "Type",
        "Total Gross",
        "Tips",
        "Estimated Tax",
        "Estimated NI",
        "Payslips",
      ];
      const rows = Object.values(workerMap).map((w: any) => {
        const taxableIncome = Math.max(0, w.total_gross - 12570);
        const estimatedTax = taxableIncome * 0.2;
        const estimatedNI = Math.max(0, w.total_gross - 12570) * 0.08;

        return [
          w.worker_id,
          w.worker_type,
          (w.total_gross / 100).toFixed(2),
          (w.total_tips / 100).toFixed(2),
          estimatedTax.toFixed(2),
          estimatedNI.toFixed(2),
          w.count,
        ];
      });

      const csv = generateCSV(headers, rows);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="payroll-compliance-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid export type" },
      { status: 400 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
