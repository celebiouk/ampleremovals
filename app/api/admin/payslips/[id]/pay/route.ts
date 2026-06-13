/**
 * PATCH /api/admin/payslips/[id]/pay — mark a payslip as paid
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { markPayslipPaid } from "@/lib/payroll";
import { z } from "zod";

const MarkPaidSchema = z.object({
  paymentMethod: z.enum(["bank_transfer", "cash"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const input = MarkPaidSchema.parse(body);

    const result = await markPayslipPaid(params.id, input.paymentMethod);
    return NextResponse.json({ success: true, data: result });
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
