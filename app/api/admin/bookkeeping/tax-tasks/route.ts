/**
 * GET /api/admin/bookkeeping/tax-tasks — the current year's tax tasks + status.
 *
 * Ensures a corporation-tax task exists for the period being filed now (period
 * ending the previous 31 March → filed in the current Jan–Apr window) and a
 * confirmation-statement task for the due date stored in Settings. The cron and
 * the "mark as done" buttons key off these rows.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { financialYearRange } from "@/lib/bookkeeping";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("financial_year_end, confirmation_statement_due")
      .eq("id", 1)
      .single();

    const yearEnd = settings?.financial_year_end || "03-31";
    const now = new Date();

    // Corporation tax: the period filed this year ends the previous 31 March.
    const corpEndYear = now.getFullYear() - 1;
    const corp = financialYearRange(yearEnd, corpEndYear);
    // Filing deadline = 12 months after the period end.
    const filingDue = `${corpEndYear + 1}-${yearEnd}`;
    await ensureTask(supabase, "corporation_tax", corp.label, filingDue);

    // Confirmation statement (if a due date is configured).
    const confDue = settings?.confirmation_statement_due as string | null;
    if (confDue) {
      const confLabel = `CS-${new Date(confDue).getFullYear()}`;
      await ensureTask(supabase, "confirmation_statement", confLabel, confDue);
    }

    const { data: tasks } = await supabase
      .from("tax_year_tasks")
      .select("*")
      .in("period_label", [corp.label, confDue ? `CS-${new Date(confDue).getFullYear()}` : "__none__"])
      .order("task_type");

    return NextResponse.json({ success: true, tasks: tasks ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function ensureTask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  taskType: string,
  periodLabel: string,
  dueDate: string
) {
  await supabase
    .from("tax_year_tasks")
    .upsert(
      { task_type: taskType, period_label: periodLabel, due_date: dueDate },
      { onConflict: "task_type,period_label", ignoreDuplicates: true }
    );
}
