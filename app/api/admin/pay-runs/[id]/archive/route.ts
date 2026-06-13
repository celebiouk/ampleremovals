/**
 * PATCH /api/admin/pay-runs/[id]/archive — archive or restore a pay run.
 * Body: { archived: boolean }. Sets/clears pay_runs.archived_at.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const archived = body?.archived !== false; // default: archive

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("pay_runs")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", params.id);

    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: archived ? "Pay run archived" : "Pay run restored",
      metadata: { pay_run_id: params.id },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, archived });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
