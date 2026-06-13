/**
 * POST /api/admin/payslips/[id]/adjustments — add an adjustment
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const AddAdjustmentSchema = z.object({
  type: z.enum(["bonus", "deduction", "advance", "expense"]),
  label: z.string().min(1),
  amount: z.number().finite(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const input = AddAdjustmentSchema.parse(body);

    const supabase = createAdminClient();

    // 1. Create the adjustment
    const { data: adj, error: adjError } = await supabase
      .from("payroll_adjustments")
      .insert({
        payslip_id: params.id,
        type: input.type,
        label: input.label,
        amount: input.amount,
      })
      .select("id")
      .single();

    if (adjError || !adj) {
      throw new Error(`Failed to create adjustment: ${adjError?.message}`);
    }

    // 2. Fetch the payslip + all adjustments
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
      action: "Adjustment added to payslip",
      metadata: {
        payslip_id: params.id,
        adjustment_type: input.type,
        adjustment_amount: input.amount,
      },
      performed_by: "admin",
    });

    return NextResponse.json({
      success: true,
      data: { adjId: adj.id, adjustmentsTotal, netPay },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", issues: e.issues },
        { status: 400 }
      );
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
