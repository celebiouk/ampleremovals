/**
 * GET /api/admin/paye/pay-runs/[id] — run + payslips (with employee names) + totals
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data: run, error } = await supabase
      .from("paye_pay_runs")
      .select("*, paye_payslips(*, employees(first_name, last_name, is_director))")
      .eq("id", params.id)
      .single();
    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payslips = ((run?.paye_payslips as any[]) ?? []).map((p) => ({
      ...p,
      employee_name: p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : "—",
      is_director: p.employees?.is_director ?? false,
    }));

    const totals = payslips.reduce(
      (t, p) => ({
        gross: t.gross + Number(p.gross_pay),
        tax: t.tax + Number(p.income_tax),
        ee_ni: t.ee_ni + Number(p.employee_ni),
        er_ni: t.er_ni + Number(p.employer_ni),
        student_loan: t.student_loan + Number(p.student_loan),
        net: t.net + Number(p.net_pay),
      }),
      { gross: 0, tax: 0, ee_ni: 0, er_ni: 0, student_loan: 0, net: 0 }
    );
    // Total cost to the company = net + tax + both NICs + student loan = gross + employer NI.
    const employerCost = totals.gross + totals.er_ni;

    return NextResponse.json({
      success: true,
      run: { ...run, paye_payslips: undefined, payslips },
      totals: { ...totals, employer_cost: employerCost },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
