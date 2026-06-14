/**
 * GET  /api/admin/bookkeeping/director-loan — ledger entries + computed balance + risk flags
 * POST /api/admin/bookkeeping/director-loan — add a ledger entry
 *
 * Balance convention: positive = company owes the director (a credit balance —
 * safe, repayable tax-free). Negative = the director owes the company (overdrawn /
 * "director's loan account in debit") → s455 tax risk if not repaid within 9
 * months of year-end, and a benefit-in-kind if it ever exceeds £10,000.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const EntrySchema = z.object({
  direction: z.enum(["director_to_company", "company_to_director"]),
  amount: z.number().finite().positive(),
  entry_date: z.string().min(1),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("director_loan_entries")
      .select("*")
      .order("entry_date", { ascending: false });

    if (error) throw new Error(error.message);

    const entries = data ?? [];
    // + director lends in (company owes director); − director takes out (owes company)
    const balance = entries.reduce(
      (sum, e) => sum + (e.direction === "director_to_company" ? Number(e.amount) : -Number(e.amount)),
      0
    );

    return NextResponse.json({
      success: true,
      entries,
      balance,
      // Overdrawn = director owes the company.
      overdrawn: balance < 0,
      overdrawn_amount: balance < 0 ? Math.abs(balance) : 0,
      s455_risk: balance < 0,
      over_10k: balance < -10000,
    });
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
    const input = EntrySchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("director_loan_entries")
      .insert({
        direction: input.direction,
        amount: input.amount,
        entry_date: input.entry_date,
        description: input.description ?? null,
        notes: input.notes ?? null,
        created_by: "admin",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: `Director's loan: ${input.direction === "director_to_company" ? "lent in" : "drawn out"} £${input.amount.toFixed(2)}`,
      metadata: { entry_id: data?.id, direction: input.direction },
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
