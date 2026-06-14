/**
 * GET /api/admin/paye/employees/[id]/p60?year=2026-27 — end-of-year P60 PDF.
 * Uses the employee's final (highest tax-week) payslip YTD for the year.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateP60PDF } from "@/lib/pdf/generate-paye-docs";
import { CURRENT_TAX_YEAR } from "@/lib/paye/rates";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const taxYear = new URL(req.url).searchParams.get("year") || CURRENT_TAX_YEAR;
    const supabase = createAdminClient();

    const { data: emp } = await supabase.from("employees").select("first_name, last_name, ni_number, tax_code").eq("id", params.id).single();
    const { data: last } = await supabase
      .from("paye_payslips")
      .select("ytd_taxable, ytd_tax, ytd_ee_ni, tax_code_used")
      .eq("employee_id", params.id).eq("tax_year", taxYear)
      .order("period_no", { ascending: false }).limit(1).maybeSingle();
    const { data: settings } = await supabase.from("settings").select("company_name").eq("id", 1).single();

    const pdf = await generateP60PDF({
      companyName: settings?.company_name ?? "Ample Removals",
      employeeName: emp ? `${emp.first_name} ${emp.last_name}` : "Employee",
      niNumber: emp?.ni_number ?? "",
      taxCode: last?.tax_code_used ?? emp?.tax_code ?? "",
      taxYear,
      totalPay: Number(last?.ytd_taxable ?? 0),
      totalTax: Number(last?.ytd_tax ?? 0),
      totalEeNi: Number(last?.ytd_ee_ni ?? 0),
    });

    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="P60-${taxYear}.pdf"` },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
