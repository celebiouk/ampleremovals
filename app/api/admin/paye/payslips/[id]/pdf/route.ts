/**
 * GET /api/admin/paye/payslips/[id]/pdf — statutory payslip PDF.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generatePayslipPDF } from "@/lib/pdf/generate-payslip-pdf";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data: p, error } = await supabase
      .from("paye_payslips")
      .select("*, employees(first_name, last_name, ni_number), paye_pay_runs(pay_date)")
      .eq("id", params.id)
      .single();
    if (error || !p) throw new Error(error?.message || "Not found");

    const { data: settings } = await supabase.from("settings").select("company_name").eq("id", 1).single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = p.employees as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = p.paye_pay_runs as any;

    const pdf = await generatePayslipPDF({
      companyName: settings?.company_name ?? "Ample Removals",
      employeeName: emp ? `${emp.first_name} ${emp.last_name}` : "Employee",
      niNumber: emp?.ni_number ?? "",
      taxCode: p.tax_code_used ?? "",
      payDate: run?.pay_date ? new Date(run.pay_date).toLocaleDateString("en-GB") : "",
      taxYear: p.tax_year,
      weekNo: p.period_no,
      grossPay: Number(p.gross_pay),
      incomeTax: Number(p.income_tax),
      employeeNi: Number(p.employee_ni),
      studentLoan: Number(p.student_loan),
      netPay: Number(p.net_pay),
      employerNi: Number(p.employer_ni),
      ytdGross: Number(p.ytd_taxable),
      ytdTax: Number(p.ytd_tax),
      ytdEeNi: Number(p.ytd_ee_ni),
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="payslip-${p.tax_year}-w${p.period_no}.pdf"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
