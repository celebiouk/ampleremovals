/**
 * GET /api/admin/payslips/[id] — get payslip detail with adjustments
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
    const { data: payslip, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        worker_id,
        worker_type,
        gross_earnings,
        tips_total,
        adjustments_total,
        net_pay,
        status,
        paid_at,
        payment_method,
        payroll_adjustments(id, type, label, amount)
      `
      )
      .eq("id", params.id)
      .single();

    if (error || !payslip) {
      throw new Error(`Failed to fetch payslip: ${error?.message}`);
    }

    return NextResponse.json({ success: true, payslip });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
