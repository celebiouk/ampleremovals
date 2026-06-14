/**
 * GET /api/admin/bookkeeping/year-end?year=YYYY — year-end summary + CT estimate.
 *
 * Aggregates the company's accounting period (year-end from settings, default
 * 31 March) and returns the profit + estimated corporation tax. `year` is the
 * END calendar year of the period (default: current year).
 *
 * ESTIMATE ONLY — capital allowances (AIA on vans), disallowable items and
 * accruals are applied by the accountant. Capital purchases are listed separately.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { estimateCorporationTax, financialYearRange } from "@/lib/bookkeeping";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const endYear = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()), 10);

    const supabase = createAdminClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("financial_year_end, vat_registered, company_name")
      .eq("id", 1)
      .single();

    const yearEnd = settings?.financial_year_end || "03-31";
    const vatRegistered = !!settings?.vat_registered;
    const { start, end, label } = financialYearRange(yearEnd, endYear);

    // Ex-VAT helper: when VAT registered, strip VAT; otherwise use gross.
    const exVat = (amount: number, vat: number) => (vatRegistered ? Number(amount) - Number(vat || 0) : Number(amount));

    // Revenue — paid invoices in the period (ex-VAT).
    const { data: invoices } = await supabase
      .from("invoices")
      .select("total, vat_amount, paid_at")
      .eq("status", "paid")
      .gte("paid_at", `${start}T00:00:00`)
      .lte("paid_at", `${end}T23:59:59`);
    const revenue = (invoices ?? []).reduce((s, i) => s + exVat(i.total, i.vat_amount), 0);

    // Wages — paid payslips in the period.
    const { data: payslips } = await supabase
      .from("payslips")
      .select("net_pay, paid_at")
      .eq("status", "paid")
      .gte("paid_at", `${start}T00:00:00`)
      .lte("paid_at", `${end}T23:59:59`);
    const wages = (payslips ?? []).reduce((s, p) => s + Number(p.net_pay), 0);

    // Expenses (non-capital) in the period.
    const { data: expenses } = await supabase
      .from("business_expenses")
      .select("amount, vat_amount, is_capital, category, category_other, expense_date, description")
      .gte("expense_date", start)
      .lte("expense_date", end);
    const opex = (expenses ?? []).filter((e) => !e.is_capital);
    const expensesTotal = opex.reduce((s, e) => s + exVat(e.amount, e.vat_amount), 0);
    const capital = (expenses ?? []).filter((e) => e.is_capital);
    const capitalTotal = capital.reduce((s, e) => s + Number(e.amount), 0);

    // Other (non-booking) income in the period.
    const { data: income } = await supabase
      .from("other_income")
      .select("amount, vat_amount, income_date")
      .gte("income_date", start)
      .lte("income_date", end);
    const otherIncome = (income ?? []).reduce((s, i) => s + exVat(i.amount, i.vat_amount), 0);

    const profit = revenue + otherIncome - wages - expensesTotal;
    const corporationTax = estimateCorporationTax(profit);

    return NextResponse.json({
      success: true,
      yearEnd: {
        period_label: label,
        period_start: start,
        period_end: end,
        vat_registered: vatRegistered,
        revenue: round2(revenue),
        other_income: round2(otherIncome),
        wages: round2(wages),
        expenses: round2(expensesTotal),
        estimated_profit: round2(profit),
        estimated_corporation_tax: round2(corporationTax),
        capital_total: round2(capitalTotal),
        capital_items: capital.map((c) => ({
          date: c.expense_date,
          label: c.category === "Other" ? c.category_other : c.category,
          description: c.description,
          amount: Number(c.amount),
        })),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
