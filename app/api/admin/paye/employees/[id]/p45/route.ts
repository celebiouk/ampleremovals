/**
 * GET /api/admin/paye/employees/[id]/p45 — leaver P45 PDF.
 * Uses the employee's most recent payslip YTD as the pay/tax to date.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateP45PDF } from "@/lib/pdf/generate-paye-docs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const { data: emp } = await supabase
      .from("employees")
      .select("first_name, last_name, ni_number, tax_code, leaving_date")
      .eq("id", params.id).single();
    const { data: last } = await supabase
      .from("paye_payslips")
      .select("ytd_taxable, ytd_tax, tax_code_used, tax_year")
      .eq("employee_id", params.id)
      .order("tax_year", { ascending: false }).order("period_no", { ascending: false })
      .limit(1).maybeSingle();
    const { data: settings } = await supabase.from("settings").select("company_name").eq("id", 1).single();

    const pdf = await generateP45PDF({
      companyName: settings?.company_name ?? "Ample Removals",
      employeeName: emp ? `${emp.first_name} ${emp.last_name}` : "Employee",
      niNumber: emp?.ni_number ?? "",
      taxCode: last?.tax_code_used ?? emp?.tax_code ?? "",
      taxYear: last?.tax_year ?? "",
      leavingDate: emp?.leaving_date ? new Date(emp.leaving_date).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB"),
      totalPayToDate: Number(last?.ytd_taxable ?? 0),
      totalTaxToDate: Number(last?.ytd_tax ?? 0),
    });

    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="P45.pdf"` },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
