/**
 * GET /api/admin/payslips/[id]/pdf — render a payslip PDF
 * Uses @react-pdf/renderer
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

// TODO: Create PayslipPDF component
// For now, return a placeholder response that indicates the PDF route is ready

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Fetch payslip + worker + earnings + adjustments
    const { data: payslip, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        pay_run_id,
        worker_type,
        worker_id,
        gross_earnings,
        tips_total,
        adjustments_total,
        net_pay,
        status,
        paid_at,
        payment_method,
        created_at,
        pay_runs!inner(reference, period_start, period_end),
        payslip_earnings(
          earning_id,
          driver_earnings(
            booking_id,
            gross_earnings,
            tip_amount,
            booking_total
          )
        ),
        payroll_adjustments(type, label, amount)
      `
      )
      .eq("id", params.id)
      .single();

    if (error || !payslip) {
      throw new Error(`Failed to fetch payslip: ${error?.message}`);
    }

    // Fetch worker details
    const tableName = payslip.worker_type === "driver" ? "drivers" : "cleaners";
    const { data: worker, error: workerError } = await supabase
      .from(tableName)
      .select("id, first_name, last_name, email, phone")
      .eq("id", payslip.worker_id)
      .single();

    if (workerError || !worker) {
      throw new Error(
        `Failed to fetch ${tableName}: ${workerError?.message}`
      );
    }

    // TODO: Build PayslipPDF React component and render with @react-pdf/renderer
    // For Phase 0, return a simple JSON response indicating PDF is ready
    // This will be implemented in Phase 1 when we have the UI design locked

    return NextResponse.json({
      success: true,
      message: "PDF endpoint ready for Phase 1 implementation",
      data: {
        payslipId: payslip.id,
        workerName: `${worker.first_name} ${worker.last_name}`,
        netPay: payslip.net_pay,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
