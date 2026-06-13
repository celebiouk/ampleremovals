/**
 * DELETE /api/admin/payslips/[id]/adjustments/[adjId] — remove an adjustment
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; adjId: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // 1. Delete the adjustment
    const { error: delError } = await supabase
      .from("payroll_adjustments")
      .delete()
      .eq("id", params.adjId)
      .eq("payslip_id", params.id);

    if (delError) {
      throw new Error(`Failed to delete adjustment: ${delError.message}`);
    }

    // 2. Fetch the payslip + remaining adjustments
    const { data: payslip, error: psError } = await supabase
      .from("payslips")
      .select(
        `
        id,
        gross_earnings,
        tips_total,
        payroll_adjustments(amount)
      `
      )
      .eq("id", params.id)
      .single();

    if (psError || !payslip) {
      throw new Error(`Failed to fetch payslip: ${psError?.message}`);
    }

    // 3. Recompute totals
    const adjustmentsTotal = (payslip.payroll_adjustments || []).reduce(
      (sum, a) => sum + a.amount,
      0
    );
    const netPay = payslip.gross_earnings + payslip.tips_total + adjustmentsTotal;

    // 4. Update payslip
    await supabase
      .from("payslips")
      .update({ adjustments_total: adjustmentsTotal, net_pay: netPay })
      .eq("id", params.id);

    // 5. Log the action
    await supabase.from("activity_log").insert({
      booking_id: null,
      action: "Adjustment removed from payslip",
      metadata: {
        payslip_id: params.id,
        adjustment_id: params.adjId,
      },
      performed_by: "admin",
    });

    return NextResponse.json({
      success: true,
      data: { adjustmentsTotal, netPay },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
