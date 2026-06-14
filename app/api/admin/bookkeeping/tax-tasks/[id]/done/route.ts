/**
 * PATCH /api/admin/bookkeeping/tax-tasks/[id]/done — mark a tax task done (or reopen).
 * Body: { done?: boolean } (default true). Stops that year's reminders.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const done = body?.done !== false;

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("tax_year_tasks")
      .update({ status: done ? "done" : "pending", completed_at: done ? new Date().toISOString() : null })
      .eq("id", params.id);
    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: done ? "Tax task marked done" : "Tax task reopened",
      metadata: { task_id: params.id },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, done });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
