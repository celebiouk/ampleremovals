/**
 * GET  /api/admin/paye/pay-runs — list weekly PAYE runs
 * POST /api/admin/paye/pay-runs — create a run for a tax week and compute every
 *      active employee's payslip (gross-to-net, with YTD carried forward).
 *
 * Body: { tax_year, period_no, period_start?, period_end?, pay_date,
 *         hours?: { [employeeId]: number } }  (hours used for hourly staff)
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { calculatePayslip, type PayslipYTD } from "@/lib/paye/calculate-payslip";

const RunSchema = z.object({
  tax_year: z.string().min(1),
  period_no: z.number().int().min(1).max(53),
  period_start: z.string().optional().nullable(),
  period_end: z.string().optional().nullable(),
  pay_date: z.string().min(1),
  hours: z.record(z.string(), z.number()).optional(),
});

const round2 = (n: number) => Math.round(n * 100) / 100;
const ZERO_YTD: PayslipYTD = { gross: 0, taxable: 0, tax: 0, employeeNi: 0, employerNi: 0, studentLoan: 0 };

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("paye_pay_runs")
      .select("*, paye_payslips(count)")
      .order("pay_date", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, runs: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const input = RunSchema.parse(await req.json());
    const supabase = createAdminClient();

    const reference = `PY-${input.tax_year}-W${String(input.period_no).padStart(2, "0")}`;
    const { data: run, error: runErr } = await supabase
      .from("paye_pay_runs")
      .insert({
        reference,
        tax_year: input.tax_year,
        period_no: input.period_no,
        period_start: input.period_start || null,
        period_end: input.period_end || null,
        pay_date: input.pay_date,
      })
      .select("id")
      .single();
    if (runErr) throw new Error(runErr.message);

    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "active");
    if (empErr) throw new Error(empErr.message);

    const payslipRows = [];
    for (const emp of employees ?? []) {
      // Prior YTD = the employee's most recent earlier payslip this tax year.
      const { data: prior } = await supabase
        .from("paye_payslips")
        .select("ytd_gross, ytd_taxable, ytd_tax, ytd_ee_ni, ytd_er_ni, ytd_student_loan")
        .eq("employee_id", emp.id)
        .eq("tax_year", input.tax_year)
        .lt("period_no", input.period_no)
        .order("period_no", { ascending: false })
        .limit(1)
        .maybeSingle();
      const ytd: PayslipYTD = prior
        ? {
            gross: Number(prior.ytd_gross), taxable: Number(prior.ytd_taxable), tax: Number(prior.ytd_tax),
            employeeNi: Number(prior.ytd_ee_ni), employerNi: Number(prior.ytd_er_ni), studentLoan: Number(prior.ytd_student_loan),
          }
        : ZERO_YTD;

      const hours = input.hours?.[emp.id];
      const gross =
        emp.pay_basis === "salary"
          ? round2(Number(emp.annual_salary) / 52)
          : round2((hours ?? 0) * Number(emp.hourly_rate));

      const calc = calculatePayslip({
        grossThisPeriod: gross,
        taxCode: emp.tax_code,
        taxBasisWeek1: emp.tax_basis === "week1month1",
        isDirector: emp.is_director,
        studentLoanPlan: emp.student_loan_plan,
        postgradLoan: emp.postgrad_loan,
        periodNo: input.period_no,
        taxYear: input.tax_year,
        ytd,
      });

      payslipRows.push({
        paye_pay_run_id: run!.id,
        employee_id: emp.id,
        tax_year: input.tax_year,
        period_no: input.period_no,
        hours: emp.pay_basis === "hourly" ? (hours ?? 0) : null,
        gross_pay: calc.grossPay,
        taxable_pay: calc.taxablePay,
        income_tax: calc.incomeTax,
        employee_ni: calc.employeeNi,
        employer_ni: calc.employerNi,
        student_loan: calc.studentLoan,
        net_pay: calc.netPay,
        tax_code_used: emp.tax_code,
        ni_category: emp.ni_category,
        ytd_gross: calc.ytd.gross,
        ytd_taxable: calc.ytd.taxable,
        ytd_tax: calc.ytd.tax,
        ytd_ee_ni: calc.ytd.employeeNi,
        ytd_er_ni: calc.ytd.employerNi,
        ytd_student_loan: calc.ytd.studentLoan,
      });
    }

    if (payslipRows.length > 0) {
      const { error: psErr } = await supabase.from("paye_payslips").insert(payslipRows);
      if (psErr) throw new Error(psErr.message);
    }

    await supabase.from("activity_log").insert({
      booking_id: null,
      action: `PAYE run ${reference} created (${payslipRows.length} payslips)`,
      metadata: { run_id: run!.id },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, id: run!.id, payslips: payslipRows.length });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid input", issues: e.issues }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
