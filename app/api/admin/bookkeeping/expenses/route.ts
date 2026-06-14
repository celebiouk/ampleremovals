/**
 * GET  /api/admin/bookkeeping/expenses — list (optional ?from=&to=&category=)
 * POST /api/admin/bookkeeping/expenses — create a company expense
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const ExpenseSchema = z.object({
  category: z.string().min(1),
  category_other: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().finite().nonnegative(),
  vat_amount: z.number().finite().nonnegative().optional(),
  expense_date: z.string().min(1),
  supplier: z.string().optional().nullable(),
  is_capital: z.boolean().optional(),
  receipt_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const category = url.searchParams.get("category");

    const supabase = createAdminClient();
    let query = supabase.from("business_expenses").select("*").order("expense_date", { ascending: false });
    if (from) query = query.gte("expense_date", from);
    if (to) query = query.lte("expense_date", to);
    if (category && category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, expenses: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const input = ExpenseSchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("business_expenses")
      .insert({
        category: input.category,
        category_other: input.category === "Other" ? input.category_other ?? null : null,
        description: input.description ?? null,
        amount: input.amount,
        vat_amount: input.vat_amount ?? 0,
        expense_date: input.expense_date,
        supplier: input.supplier ?? null,
        is_capital: input.is_capital ?? false,
        receipt_url: input.receipt_url ?? null,
        notes: input.notes ?? null,
        created_by: "admin",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: `Expense added: ${input.category} £${input.amount.toFixed(2)}`,
      metadata: { expense_id: data?.id, category: input.category },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid input", issues: e.issues }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
