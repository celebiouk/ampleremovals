/**
 * GET    /api/admin/paye/employees/[id] — one employee
 * PATCH  /api/admin/paye/employees/[id] — update
 * DELETE /api/admin/paye/employees/[id] — delete
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED = [
  "first_name", "last_name", "ni_number", "tax_code", "tax_basis", "ni_category",
  "date_of_birth", "address", "email", "phone", "start_date", "leaving_date",
  "is_director", "pay_basis", "annual_salary", "hourly_rate", "student_loan_plan",
  "postgrad_loan", "bank_sort_code", "bank_account", "status",
];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("employees").select("*").eq("id", params.id).single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, employee: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};
    for (const k of ALLOWED) if (k in body) update[k] = body[k] === "" ? null : body[k];

    const supabase = createAdminClient();
    const { error } = await supabase.from("employees").update(update).eq("id", params.id);
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
    const { error } = await supabase.from("employees").delete().eq("id", params.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
