/**
 * GET /api/admin/pay-runs/[id]/export — export payslips as CSV for bank transfer
 * Format: name, sort_code, account_number, amount, reference
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Fetch the run + payslips
    const { data: run, error: runError } = await supabase
      .from("pay_runs")
      .select(
        `
        id,
        reference,
        period_start,
        period_end,
        payslips(
          id,
          worker_type,
          worker_id,
          net_pay
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (runError || !run) {
      throw new Error(`Failed to fetch pay run: ${runError?.message}`);
    }

    // For each payslip, fetch worker details + bank details
    const rows: string[] = [];
    rows.push("Name,Sort Code,Account Number,Amount (£),Reference");

    for (const payslip of run.payslips || []) {
      const tableName =
        payslip.worker_type === "driver" ? "drivers" : "cleaners";

      // Fetch worker name
      const { data: worker, error: workerError } = await supabase
        .from(tableName)
        .select("first_name, last_name")
        .eq("id", payslip.worker_id)
        .single();

      if (workerError || !worker) {
        console.warn(
          `Could not fetch ${tableName} ${payslip.worker_id}: ${workerError?.message}`
        );
        continue;
      }

      // Fetch bank details (if stored)
      const { data: bankDetails } = await supabase
        .from("worker_bank_details")
        .select("sort_code, account_number")
        .eq("worker_type", payslip.worker_type)
        .eq("worker_id", payslip.worker_id)
        .single();

      const name = `${worker.first_name} ${worker.last_name}`;
      const sortCode = bankDetails?.sort_code || "";
      const accountNumber = bankDetails?.account_number || "";
      const amount = (payslip.net_pay / 100).toFixed(2); // Convert from pence to £

      rows.push(
        `"${name}","${sortCode}","${accountNumber}",${amount},"${payslip.id}"`
      );
    }

    const csv = rows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payroll-${run.reference}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
