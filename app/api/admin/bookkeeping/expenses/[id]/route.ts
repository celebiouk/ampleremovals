/**
 * PATCH  /api/admin/bookkeeping/expenses/[id] — update an expense
 * DELETE /api/admin/bookkeeping/expenses/[id] — delete an expense
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Only allow known columns through.
    const allowed = [
      "category", "category_other", "description", "amount", "vat_amount",
      "expense_date", "supplier", "is_capital", "receipt_url", "notes",
    ];
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) update[k] = body[k];

    const { error } = await supabase.from("business_expenses").update(update).eq("id", params.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("business_expenses").delete().eq("id", params.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
