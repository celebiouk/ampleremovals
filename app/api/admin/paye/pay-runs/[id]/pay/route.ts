/**
 * PATCH /api/admin/paye/pay-runs/[id]/pay — mark the whole run paid.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    await supabase.from("paye_payslips").update({ status: "paid", paid_at: now }).eq("paye_pay_run_id", params.id);
    const { error } = await supabase.from("paye_pay_runs").update({ status: "paid" }).eq("id", params.id);
    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: "PAYE run marked paid",
      metadata: { run_id: params.id },
      performed_by: "admin",
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
