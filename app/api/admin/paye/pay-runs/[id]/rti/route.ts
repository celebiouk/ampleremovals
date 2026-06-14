/**
 * GET /api/admin/paye/pay-runs/[id]/rti — the per-employee figures to key into
 * HMRC Basic PAYE Tools for the FPS (Full Payment Submission). CSV.
 */

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const row = (...c: unknown[]) => c.map(esc).join(",");

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data: run, error } = await supabase
      .from("paye_pay_runs")
      .select("reference, tax_year, period_no, pay_date, paye_payslips(*, employees(first_name, last_name, ni_number))")
      .eq("id", params.id)
      .single();
    if (error) throw new Error(error.message);

    const lines: string[] = [];
    lines.push(row("RTI / FPS figures", run?.reference));
    lines.push(row("Tax year", run?.tax_year, "Tax week", run?.period_no, "Pay date", run?.pay_date));
    lines.push("");
    lines.push(row("Employee", "NI number", "Tax code", "Gross", "Income tax", "Employee NI", "Employer NI", "Student loan", "Net pay", "YTD gross", "YTD tax", "YTD EE NI"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of ((run?.paye_payslips as any[]) ?? [])) {
      const name = p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : "";
      lines.push(row(
        name, p.employees?.ni_number ?? "", p.tax_code_used,
        Number(p.gross_pay).toFixed(2), Number(p.income_tax).toFixed(2), Number(p.employee_ni).toFixed(2),
        Number(p.employer_ni).toFixed(2), Number(p.student_loan).toFixed(2), Number(p.net_pay).toFixed(2),
        Number(p.ytd_gross).toFixed(2), Number(p.ytd_tax).toFixed(2), Number(p.ytd_ee_ni).toFixed(2),
      ));
    }

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="rti-${run?.reference}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
