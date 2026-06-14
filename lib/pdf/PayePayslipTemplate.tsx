import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PURPLE = "#6b21a8";
const GREY = "#64748b";
const LIGHT = "#f8fafc";

export interface PayePayslipData {
  companyName: string;
  employeeName: string;
  niNumber: string;
  taxCode: string;
  payDate: string;
  taxYear: string;
  weekNo: number;
  grossPay: number;
  incomeTax: number;
  employeeNi: number;
  studentLoan: number;
  netPay: number;
  employerNi: number;
  ytdGross: number;
  ytdTax: number;
  ytdEeNi: number;
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", padding: 40 },
  row: { flexDirection: "row" },
  company: { fontSize: 15, fontFamily: "Helvetica-Bold", color: PURPLE },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: PURPLE, letterSpacing: 1 },
  divider: { borderBottomWidth: 2, borderBottomColor: PURPLE, marginVertical: 14 },
  label: { fontSize: 8, color: GREY, textTransform: "uppercase", letterSpacing: 0.5 },
  val: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  colHead: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#fff", backgroundColor: PURPLE, padding: 5, borderRadius: 2 },
  lineRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 5 },
  lineRowAlt: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 5, backgroundColor: LIGHT },
  lineLabel: { fontSize: 9 },
  lineVal: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  netBox: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f5f3ff", borderRadius: 4, padding: 10, marginTop: 10 },
  netLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: PURPLE },
  netVal: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PURPLE },
  ytd: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingVertical: 2 },
  note: { fontSize: 7.5, color: GREY, marginTop: 16, lineHeight: 1.4 },
});

const gbp = (n: number) => `£${Number(n).toFixed(2)}`;

export function PayePayslipDocument({ data }: { data: PayePayslipData }) {
  return (
    <Document title={`Payslip — ${data.employeeName}`} author={data.companyName}>
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.company}>{data.companyName}</Text>
            <Text style={{ fontSize: 9, color: GREY, marginTop: 2 }}>Payslip</Text>
          </View>
          <Text style={s.title}>PAYSLIP</Text>
        </View>

        <View style={s.divider} />

        {/* Employee + period */}
        <View style={s.row}>
          <View style={{ flex: 2 }}>
            <Text style={s.label}>Employee</Text>
            <Text style={s.val}>{data.employeeName}</Text>
            <Text style={s.label}>NI number</Text>
            <Text style={s.val}>{data.niNumber || "—"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Tax code</Text>
            <Text style={s.val}>{data.taxCode}</Text>
            <Text style={s.label}>Tax year</Text>
            <Text style={s.val}>{data.taxYear}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Pay date</Text>
            <Text style={s.val}>{data.payDate}</Text>
            <Text style={s.label}>Tax week</Text>
            <Text style={s.val}>{data.weekNo}</Text>
          </View>
        </View>

        {/* Payments / Deductions */}
        <View style={[s.row, { marginTop: 8, gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.colHead}>Payments</Text>
            <View style={s.lineRow}><Text style={s.lineLabel}>Gross pay</Text><Text style={s.lineVal}>{gbp(data.grossPay)}</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.colHead}>Deductions</Text>
            <View style={s.lineRow}><Text style={s.lineLabel}>Income tax (PAYE)</Text><Text style={s.lineVal}>{gbp(data.incomeTax)}</Text></View>
            <View style={s.lineRowAlt}><Text style={s.lineLabel}>National Insurance</Text><Text style={s.lineVal}>{gbp(data.employeeNi)}</Text></View>
            {data.studentLoan > 0 && <View style={s.lineRow}><Text style={s.lineLabel}>Student loan</Text><Text style={s.lineVal}>{gbp(data.studentLoan)}</Text></View>}
          </View>
        </View>

        <View style={s.netBox}>
          <Text style={s.netLabel}>NET PAY</Text>
          <Text style={s.netVal}>{gbp(data.netPay)}</Text>
        </View>

        {/* YTD */}
        <Text style={[s.label, { marginTop: 16, marginBottom: 4 }]}>Year to date</Text>
        <View style={s.ytd}><Text style={s.lineLabel}>Taxable gross</Text><Text style={s.lineVal}>{gbp(data.ytdGross)}</Text></View>
        <View style={s.ytd}><Text style={s.lineLabel}>Income tax</Text><Text style={s.lineVal}>{gbp(data.ytdTax)}</Text></View>
        <View style={s.ytd}><Text style={s.lineLabel}>National Insurance</Text><Text style={s.lineVal}>{gbp(data.ytdEeNi)}</Text></View>

        <Text style={s.note}>
          Employer&apos;s National Insurance this period: {gbp(data.employerNi)} (a company cost, not deducted from your pay).
          Figures calculated on the {data.taxYear} rates. Keep this payslip for your records.
        </Text>
      </Page>
    </Document>
  );
}
