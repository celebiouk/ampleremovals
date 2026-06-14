/**
 * GET /api/admin/bookkeeping/year-end/export?year=YYYY — accountant CSV pack.
 * One CSV with a summary block plus the raw expense, other-income, capital and
 * director's-loan line items for the accounting period. Opens cleanly in Excel.
 */

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { financialYearRange, estimateCorporationTax } from "@/lib/bookkeeping";
import { generateYearEndPackPDF } from "@/lib/pdf/generate-year-end-pack-pdf";

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const row = (...cells: unknown[]) => cells.map(esc).join(",");

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const endYear = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()), 10);
    const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";

    const supabase = createAdminClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("financial_year_end, company_name, company_number, company_utr")
      .eq("id", 1)
      .single();
    const { start, end, label } = financialYearRange(settings?.financial_year_end || "03-31", endYear);

    const [{ data: expenses }, { data: income }, { data: loan }, { data: invoices }, { data: payslips }] =
      await Promise.all([
        supabase.from("business_expenses").select("*").gte("expense_date", start).lte("expense_date", end).order("expense_date"),
        supabase.from("other_income").select("*").gte("income_date", start).lte("income_date", end).order("income_date"),
        supabase.from("director_loan_entries").select("*").gte("entry_date", start).lte("entry_date", end).order("entry_date"),
        supabase.from("invoices").select("total, vat_amount, paid_at, invoice_number").eq("status", "paid").gte("paid_at", `${start}T00:00:00`).lte("paid_at", `${end}T23:59:59`),
        supabase.from("payslips").select("net_pay, paid_at").eq("status", "paid").gte("paid_at", `${start}T00:00:00`).lte("paid_at", `${end}T23:59:59`),
      ]);

    const revenue = (invoices ?? []).reduce((s, i) => s + Number(i.total), 0);
    const wages = (payslips ?? []).reduce((s, p) => s + Number(p.net_pay), 0);
    const opex = (expenses ?? []).filter((e) => !e.is_capital).reduce((s, e) => s + Number(e.amount), 0);
    const capital = (expenses ?? []).filter((e) => e.is_capital);
    const capitalTotal = capital.reduce((s, e) => s + Number(e.amount), 0);
    const otherInc = (income ?? []).reduce((s, i) => s + Number(i.amount), 0);
    const profit = revenue + otherInc - wages - opex;

    // ── PDF pack ───────────────────────────────────────────────────────────
    if (format === "pdf") {
      const pdf = await generateYearEndPackPDF({
        companyName: settings?.company_name ?? "Company",
        companyNumber: settings?.company_number ?? "",
        utr: settings?.company_utr ?? "",
        periodStart: start,
        periodEnd: end,
        vatRegistered: false,
        generatedAt: new Date().toLocaleDateString("en-GB"),
        summary: {
          revenue, otherIncome: otherInc, wages, expenses: opex, profit,
          corporationTax: estimateCorporationTax(profit), capitalTotal,
        },
        expenses: (expenses ?? []).map((e) => ({
          date: e.expense_date,
          category: e.category === "Other" ? (e.category_other ?? "Other") : e.category,
          supplier: e.supplier ?? "",
          amount: Number(e.amount),
          capital: !!e.is_capital,
        })),
        income: (income ?? []).map((i) => ({
          date: i.income_date,
          category: i.category === "Other" ? (i.category_other ?? "Other") : i.category,
          amount: Number(i.amount),
        })),
        capital: capital.map((c) => ({
          date: c.expense_date,
          item: c.category === "Other" ? (c.category_other ?? "Other") : c.category,
          amount: Number(c.amount),
        })),
        loan: (loan ?? []).map((l) => ({
          date: l.entry_date,
          direction: l.direction === "director_to_company" ? "Put in" : "Took out",
          amount: Number(l.amount),
        })),
      });
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="year-end-pack-${label}.pdf"`,
        },
      });
    }

    const lines: string[] = [];
    lines.push(row("Year-End Pack", settings?.company_name ?? "Company"));
    lines.push(row("Accounting period", `${start} to ${end}`, "Label", label));
    lines.push(row("Company number", settings?.company_number ?? "", "UTR", settings?.company_utr ?? ""));
    lines.push("");
    lines.push(row("SUMMARY", "Amount (£)"));
    lines.push(row("Revenue (paid invoices)", revenue.toFixed(2)));
    lines.push(row("Other income", otherInc.toFixed(2)));
    lines.push(row("Wages (paid payslips)", wages.toFixed(2)));
    lines.push(row("Expenses (excl. capital)", opex.toFixed(2)));
    lines.push(row("Estimated profit", (revenue + otherInc - wages - opex).toFixed(2)));
    lines.push("");
    lines.push(row("EXPENSES", "Date", "Category", "Reason (Other)", "Supplier", "Amount", "VAT", "Capital?", "Description"));
    for (const e of expenses ?? []) {
      lines.push(row("", e.expense_date, e.category, e.category_other ?? "", e.supplier ?? "", Number(e.amount).toFixed(2), Number(e.vat_amount).toFixed(2), e.is_capital ? "YES" : "", e.description ?? ""));
    }
    lines.push("");
    lines.push(row("OTHER INCOME", "Date", "Category", "Reason (Other)", "Amount", "VAT", "Description"));
    for (const i of income ?? []) {
      lines.push(row("", i.income_date, i.category, i.category_other ?? "", Number(i.amount).toFixed(2), Number(i.vat_amount).toFixed(2), i.description ?? ""));
    }
    lines.push("");
    lines.push(row("CAPITAL PURCHASES (for capital allowances)", "Date", "Item", "Amount", "Description"));
    for (const c of capital) {
      lines.push(row("", c.expense_date, c.category === "Other" ? c.category_other : c.category, Number(c.amount).toFixed(2), c.description ?? ""));
    }
    lines.push("");
    lines.push(row("DIRECTOR'S LOAN", "Date", "Direction", "Amount", "Description"));
    for (const l of loan ?? []) {
      lines.push(row("", l.entry_date, l.direction === "director_to_company" ? "Put in" : "Took out", Number(l.amount).toFixed(2), l.description ?? ""));
    }

    const csv = lines.join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="year-end-pack-${label}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
