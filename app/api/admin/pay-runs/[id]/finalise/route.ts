/**
 * PATCH /api/admin/pay-runs/[id]/finalise — lock a pay run
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("pay_runs")
      .update({ status: "finalised", finalised_at: now })
      .eq("id", params.id);

    if (error) {
      throw new Error(`Failed to finalise run: ${error.message}`);
    }

    // Log the action
    await supabase.from("activity_log").insert({
      booking_id: null,
      action: "Pay run finalised",
      metadata: { pay_run_id: params.id },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, finalised_at: now });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
