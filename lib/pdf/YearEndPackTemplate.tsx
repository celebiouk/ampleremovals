import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PURPLE = "#6b21a8";
const GREEN = "#16a34a";
const GREY = "#64748b";
const LIGHT = "#f8fafc";

export interface YearEndPackData {
  companyName: string;
  companyNumber: string;
  utr: string;
  periodStart: string;
  periodEnd: string;
  vatRegistered: boolean;
  generatedAt: string;
  summary: {
    revenue: number;
    otherIncome: number;
    wages: number;
    expenses: number;
    profit: number;
    corporationTax: number;
    capitalTotal: number;
  };
  expenses: Array<{ date: string; category: string; supplier: string; amount: number; capital: boolean }>;
  income: Array<{ date: string; category: string; amount: number }>;
  capital: Array<{ date: string; item: string; amount: number }>;
  loan: Array<{ date: string; direction: string; amount: number }>;
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: "#1e293b", padding: 36, backgroundColor: "#fff" },
  row: { flexDirection: "row" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", color: PURPLE, letterSpacing: 1 },
  company: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  meta: { fontSize: 8, color: GREY, marginBottom: 1 },
  divider: { borderBottomWidth: 2, borderBottomColor: PURPLE, marginVertical: 12 },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GREY, textTransform: "uppercase", letterSpacing: 1, marginTop: 14, marginBottom: 5 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  sumLabel: { fontSize: 9, color: GREY },
  sumVal: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  sumDivider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 4 },
  ctBox: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f5f3ff", borderRadius: 4, padding: 8, marginTop: 4 },
  ctLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PURPLE },
  ctVal: { fontSize: 12, fontFamily: "Helvetica-Bold", color: PURPLE },
  th: { flexDirection: "row", backgroundColor: PURPLE, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 2 },
  thc: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#fff" },
  tr: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 6 },
  trAlt: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 6, backgroundColor: LIGHT },
  td: { fontSize: 8 },
  cDate: { flex: 2 }, cMain: { flex: 4 }, cSub: { flex: 3 }, cNum: { flex: 2, textAlign: "right" },
  note: { fontSize: 7.5, color: GREY, marginTop: 4, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, borderTopWidth: 1, borderTopColor: PURPLE, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: GREY },
});

const gbp = (n: number) => `£${Number(n).toFixed(2)}`;

function Table({ head, rows }: { head: string[]; rows: Array<{ cells: string[]; flex: number[] }> }) {
  const flex = rows[0]?.flex ?? head.map(() => 1);
  return (
    <View>
      <View style={s.th}>
        {head.map((h, i) => <Text key={i} style={[s.thc, { flex: flex[i], textAlign: i === head.length - 1 ? "right" : "left" }]}>{h}</Text>)}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={i % 2 === 0 ? s.tr : s.trAlt}>
          {r.cells.map((c, j) => <Text key={j} style={[s.td, { flex: r.flex[j], textAlign: j === r.cells.length - 1 ? "right" : "left" }]}>{c}</Text>)}
        </View>
      ))}
    </View>
  );
}

export function YearEndPackDocument({ data }: { data: YearEndPackData }) {
  const sum = data.summary;
  return (
    <Document title={`Year-End Pack — ${data.companyName}`} author={data.companyName}>
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.company}>{data.companyName}</Text>
            <Text style={s.meta}>Company no: {data.companyNumber || "—"}   ·   UTR: {data.utr || "—"}</Text>
            <Text style={s.meta}>Period: {data.periodStart} to {data.periodEnd}{data.vatRegistered ? "   ·   figures ex-VAT" : ""}</Text>
          </View>
          <Text style={s.h1}>YEAR-END</Text>
        </View>

        <View style={s.divider} />

        {/* Summary */}
        <Text style={s.sectionLabel}>Summary</Text>
        <View style={s.sumRow}><Text style={s.sumLabel}>Revenue (paid invoices)</Text><Text style={s.sumVal}>{gbp(sum.revenue)}</Text></View>
        <View style={s.sumRow}><Text style={s.sumLabel}>Other income</Text><Text style={s.sumVal}>{gbp(sum.otherIncome)}</Text></View>
        <View style={s.sumRow}><Text style={s.sumLabel}>Less: wages (paid payslips)</Text><Text style={s.sumVal}>−{gbp(sum.wages)}</Text></View>
        <View style={s.sumRow}><Text style={s.sumLabel}>Less: expenses (excl. capital)</Text><Text style={s.sumVal}>−{gbp(sum.expenses)}</Text></View>
        <View style={s.sumDivider} />
        <View style={s.sumRow}><Text style={[s.sumLabel, { fontFamily: "Helvetica-Bold", color: "#0f172a" }]}>Estimated profit</Text><Text style={s.sumVal}>{gbp(sum.profit)}</Text></View>
        <View style={s.ctBox}><Text style={s.ctLabel}>Estimated corporation tax</Text><Text style={s.ctVal}>{gbp(sum.corporationTax)}</Text></View>
        <Text style={s.note}>
          ESTIMATE ONLY. Capital allowances (e.g. AIA on vehicles, total {gbp(sum.capitalTotal)} below), disallowable items and
          accruals are applied by the accountant. Corporation tax uses FY2023+ rates with marginal relief, assuming one associated
          company and a 12-month period.
        </Text>

        {/* Expenses */}
        <Text style={s.sectionLabel}>Expenses ({data.expenses.length})</Text>
        {data.expenses.length === 0 ? <Text style={s.note}>None.</Text> : (
          <Table head={["Date", "Category", "Supplier", "Amount"]}
            rows={data.expenses.map((e) => ({ cells: [e.date, e.category + (e.capital ? " (capital)" : ""), e.supplier || "—", gbp(e.amount)], flex: [2, 4, 3, 2] }))} />
        )}

        {/* Other income */}
        <Text style={s.sectionLabel}>Other income ({data.income.length})</Text>
        {data.income.length === 0 ? <Text style={s.note}>None.</Text> : (
          <Table head={["Date", "Category", "Amount"]}
            rows={data.income.map((i) => ({ cells: [i.date, i.category, gbp(i.amount)], flex: [2, 6, 2] }))} />
        )}

        {/* Capital */}
        {data.capital.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Capital purchases — for capital allowances ({gbp(sum.capitalTotal)})</Text>
            <Table head={["Date", "Item", "Amount"]}
              rows={data.capital.map((c) => ({ cells: [c.date, c.item, gbp(c.amount)], flex: [2, 6, 2] }))} />
          </>
        )}

        {/* Director's loan */}
        {data.loan.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Director&apos;s loan ({data.loan.length})</Text>
            <Table head={["Date", "Direction", "Amount"]}
              rows={data.loan.map((l) => ({ cells: [l.date, l.direction, gbp(l.amount)], flex: [2, 6, 2] }))} />
          </>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{data.companyName} · Year-end pack · Generated {data.generatedAt}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
