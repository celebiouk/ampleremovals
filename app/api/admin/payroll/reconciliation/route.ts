/**
 * GET /api/admin/payroll/reconciliation — payment integrity reconciliation.
 *
 * Workers are paid by manual bank transfer (see the CSV export), not Stripe, so
 * there is no external payout feed to match against. Instead this reconciles
 * INTERNAL consistency of "paid" payslips and flags mismatches:
 *   - a paid payslip whose linked driver_earnings weren't all flipped to paid
 *     (a partial/failed transactional mark-paid),
 *   - a paid payslip missing paid_at or payment_method.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { attachWorkerNames } from "@/lib/payroll-workers";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    const { data: paid, error } = await supabase
      .from("payslips")
      .select(
        `id, worker_id, worker_type, net_pay, paid_at, payment_method, pay_run_id,
         payslip_earnings(driver_earnings(id, status))`
      )
      .eq("status", "paid");

    if (error) throw new Error(error.message);

    type Issue = {
      payslip_id: string;
      worker_id: string;
      worker_type: string;
      net_pay: number;
      problems: string[];
    };

    const issues: Issue[] = [];
    let totalPaid = 0;

    for (const p of paid ?? []) {
      totalPaid += Number(p.net_pay) || 0;
      const problems: string[] = [];

      if (!p.paid_at) problems.push("Missing paid date");
      if (!p.payment_method) problems.push("Missing payment method");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const links = (p.payslip_earnings as any[]) ?? [];
      const earnings = links.map((l) => l.driver_earnings).filter(Boolean);
      const unpaidEarnings = earnings.filter((e) => e.status !== "paid").length;
      if (unpaidEarnings > 0) {
        problems.push(`${unpaidEarnings} linked earning(s) not marked paid`);
      }

      if (problems.length > 0) {
        issues.push({
          payslip_id: p.id,
          worker_id: p.worker_id,
          worker_type: p.worker_type,
          net_pay: Number(p.net_pay) || 0,
          problems,
        });
      }
    }

    const issuesWithNames = await attachWorkerNames(supabase, issues);

    return NextResponse.json({
      success: true,
      reconciliation: {
        total_paid_payslips: (paid ?? []).length,
        total_paid_amount: totalPaid,
        issue_count: issues.length,
        issues: issuesWithNames,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
