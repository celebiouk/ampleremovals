import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PURPLE = "#6b21a8";
const GREEN = "#16a34a";
const GREY = "#64748b";
const LIGHT_GREY = "#f8fafc";
const BORDER = "#e2e8f0";

export interface YearEndPDFData {
  companyName: string;
  taxYear: string;
  workerName: string;
  workerType: string;
  totalGross: number;
  totalTips: number;
  totalNet: number;
  estimatedTax: number;
  estimatedNI: number;
  payslips: Array<{
    period: string;
    reference: string;
    gross: number;
    tips: number;
    net: number;
    status: string;
  }>;
  generatedAt: string;
}

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", padding: 40, backgroundColor: "#ffffff" },
  row: { flexDirection: "row" },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PURPLE, marginBottom: 3 },
  companyDetail: { fontSize: 9, color: GREY, marginBottom: 1 },
  docTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", color: PURPLE, letterSpacing: 1 },
  docSub: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 4 },
  divider: { borderBottomWidth: 2, borderBottomColor: PURPLE, marginVertical: 16 },
  sectionLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: GREY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  workerName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  workerDetail: { fontSize: 9, color: GREY, marginBottom: 1, textTransform: "capitalize" },
  // summary cards
  cards: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 14 },
  card: { flex: 1, backgroundColor: LIGHT_GREY, borderRadius: 4, padding: 10 },
  cardLabel: { fontSize: 7, color: GREY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  cardValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  cardValuePurple: { fontSize: 13, fontFamily: "Helvetica-Bold", color: PURPLE },
  cardValueGreen: { fontSize: 13, fontFamily: "Helvetica-Bold", color: GREEN },
  // tax box
  taxBox: { backgroundColor: "#fffbeb", borderRadius: 4, padding: 10, marginBottom: 16, borderWidth: 0.5, borderColor: "#fde68a" },
  taxRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  taxLabel: { fontSize: 9, color: "#92400e" },
  taxValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#92400e" },
  taxNote: { fontSize: 7, color: "#a16207", marginTop: 6, lineHeight: 1.4 },
  // table
  tableHeader: { flexDirection: "row", backgroundColor: PURPLE, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 2 },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  tr: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8 },
  trAlt: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, backgroundColor: LIGHT_GREY },
  td: { fontSize: 9 },
  periodCol: { flex: 3 },
  numCol: { flex: 2, textAlign: "right" },
  statusCol: { flex: 2, textAlign: "right", textTransform: "capitalize" },
  totalRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: PURPLE, marginTop: 2 },
  totalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PURPLE },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: PURPLE, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: GREY },
});

function gbp(n: number): string {
  return `£${n.toFixed(2)}`;
}

export function YearEndStatementDocument({ data }: { data: YearEndPDFData }) {
  return (
    <Document title={`Year-End Statement ${data.taxYear} — ${data.workerName}`} author={data.companyName}>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.row}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.companyDetail}>Year-end earnings & estimated tax statement</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>YEAR-END</Text>
            <Text style={styles.docSub}>Tax year {data.taxYear}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* WORKER */}
        <Text style={styles.sectionLabel}>Statement for</Text>
        <Text style={styles.workerName}>{data.workerName}</Text>
        <Text style={styles.workerDetail}>{data.workerType}</Text>

        {/* SUMMARY CARDS */}
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Gross earnings</Text>
            <Text style={styles.cardValue}>{gbp(data.totalGross)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Tips</Text>
            <Text style={styles.cardValueGreen}>{gbp(data.totalTips)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Net paid</Text>
            <Text style={styles.cardValuePurple}>{gbp(data.totalNet)}</Text>
          </View>
        </View>

        {/* TAX ESTIMATE */}
        <View style={styles.taxBox}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Estimated income tax (20% over £12,570)</Text>
            <Text style={styles.taxValue}>{gbp(data.estimatedTax)}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Estimated National Insurance (8% over £12,570)</Text>
            <Text style={styles.taxValue}>{gbp(data.estimatedNI)}</Text>
          </View>
          <Text style={styles.taxNote}>
            Estimates only, for guidance. This is not an official HMRC P45/P60. Workers are
            responsible for their own tax affairs; consult an accountant for accurate figures.
          </Text>
        </View>

        {/* PAYSLIP BREAKDOWN */}
        <Text style={[styles.sectionLabel, { marginBottom: 6 }]}>Payslips ({data.payslips.length})</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.periodCol]}>Period</Text>
          <Text style={[styles.th, styles.numCol]}>Gross</Text>
          <Text style={[styles.th, styles.numCol]}>Tips</Text>
          <Text style={[styles.th, styles.numCol]}>Net</Text>
          <Text style={[styles.th, styles.statusCol]}>Status</Text>
        </View>
        {data.payslips.map((p, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tr : styles.trAlt}>
            <Text style={[styles.td, styles.periodCol]}>{p.period}</Text>
            <Text style={[styles.td, styles.numCol]}>{gbp(p.gross)}</Text>
            <Text style={[styles.td, styles.numCol]}>{gbp(p.tips)}</Text>
            <Text style={[styles.td, styles.numCol]}>{gbp(p.net)}</Text>
            <Text style={[styles.td, styles.statusCol]}>{p.status}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.periodCol]}>Total</Text>
          <Text style={[styles.totalLabel, styles.numCol]}>{gbp(data.totalGross)}</Text>
          <Text style={[styles.totalLabel, styles.numCol]}>{gbp(data.totalTips)}</Text>
          <Text style={[styles.totalLabel, styles.numCol]}>{gbp(data.totalNet)}</Text>
          <Text style={[styles.totalLabel, styles.statusCol]}> </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.companyName} · Generated {data.generatedAt}</Text>
          <Text style={styles.footerText}>Year-end statement {data.taxYear}</Text>
        </View>
      </Page>
    </Document>
  );
}
