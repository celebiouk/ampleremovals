/**
 * GET  /api/admin/bookkeeping/income — list non-booking income (optional ?from=&to=&category=)
 * POST /api/admin/bookkeeping/income — create an other-income entry
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const IncomeSchema = z.object({
  category: z.string().min(1),
  category_other: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().finite().nonnegative(),
  vat_amount: z.number().finite().nonnegative().optional(),
  income_date: z.string().min(1),
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
    let query = supabase.from("other_income").select("*").order("income_date", { ascending: false });
    if (from) query = query.gte("income_date", from);
    if (to) query = query.lte("income_date", to);
    if (category && category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, income: data ?? [] });
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
    const input = IncomeSchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("other_income")
      .insert({
        category: input.category,
        category_other: input.category === "Other" ? input.category_other ?? null : null,
        description: input.description ?? null,
        amount: input.amount,
        vat_amount: input.vat_amount ?? 0,
        income_date: input.income_date,
        notes: input.notes ?? null,
        created_by: "admin",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: `Other income added: ${input.category} £${input.amount.toFixed(2)}`,
      metadata: { income_id: data?.id, category: input.category },
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
