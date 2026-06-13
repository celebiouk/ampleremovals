/**
 * GET /api/admin/pay-runs — list pay runs
 * POST /api/admin/pay-runs — create a new pay run
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { generatePayRun } from "@/lib/payroll";

const CreatePayRunSchema = z.object({
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    const baseCols = "id, reference, period_start, period_end, status, created_at";

    // Try to include archived_at; gracefully fall back if the column hasn't
    // been migrated yet so the list never breaks.
    let { data: runs, error } = await supabase
      .from("pay_runs")
      .select(`${baseCols}, archived_at, payslips(count)`)
      .order("created_at", { ascending: false });

    if (error) {
      ({ data: runs, error } = await supabase
        .from("pay_runs")
        .select(`${baseCols}, payslips(count)`)
        .order("created_at", { ascending: false }));
    }

    if (error) {
      throw new Error(`Failed to fetch pay runs: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: runs });
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
    const input = CreatePayRunSchema.parse(body);

    const result = await generatePayRun(input);

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
