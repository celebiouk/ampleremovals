import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PURPLE = "#6b21a8";
const GREY = "#64748b";

export interface P60Data {
  companyName: string;
  employeeName: string;
  niNumber: string;
  taxCode: string;
  taxYear: string;
  totalPay: number;
  totalTax: number;
  totalEeNi: number;
}

export interface P45Data {
  companyName: string;
  employeeName: string;
  niNumber: string;
  taxCode: string;
  taxYear: string;
  leavingDate: string;
  totalPayToDate: number;
  totalTaxToDate: number;
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", padding: 40 },
  row: { flexDirection: "row" },
  company: { fontSize: 15, fontFamily: "Helvetica-Bold", color: PURPLE },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: PURPLE, letterSpacing: 1 },
  sub: { fontSize: 10, color: GREY },
  divider: { borderBottomWidth: 2, borderBottomColor: PURPLE, marginVertical: 14 },
  label: { fontSize: 8, color: GREY, textTransform: "uppercase", letterSpacing: 0.5 },
  val: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  lineLabel: { fontSize: 10 },
  lineVal: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  note: { fontSize: 8, color: GREY, marginTop: 20, lineHeight: 1.4 },
});

const gbp = (n: number) => `£${Number(n).toFixed(2)}`;

function Header({ company, title, sub }: { company: string; title: string; sub: string }) {
  return (
    <>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.company}>{company}</Text>
          <Text style={s.sub}>{sub}</Text>
        </View>
        <Text style={s.title}>{title}</Text>
      </View>
      <View style={s.divider} />
    </>
  );
}

function EmployeeBlock({ name, ni, code, year }: { name: string; ni: string; code: string; year: string }) {
  return (
    <View style={[s.row, { marginBottom: 12 }]}>
      <View style={{ flex: 2 }}>
        <Text style={s.label}>Employee</Text><Text style={s.val}>{name}</Text>
        <Text style={s.label}>NI number</Text><Text style={s.val}>{ni || "—"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>Tax code</Text><Text style={s.val}>{code}</Text>
        <Text style={s.label}>Tax year</Text><Text style={s.val}>{year}</Text>
      </View>
    </View>
  );
}

export function P60Document({ data }: { data: P60Data }) {
  return (
    <Document title={`P60 ${data.taxYear} — ${data.employeeName}`} author={data.companyName}>
      <Page size="A4" style={s.page}>
        <Header company={data.companyName} title="P60" sub={`End of year certificate · ${data.taxYear}`} />
        <EmployeeBlock name={data.employeeName} ni={data.niNumber} code={data.taxCode} year={data.taxYear} />
        <Text style={s.label}>Totals for the year</Text>
        <View style={{ marginTop: 6 }}>
          <View style={s.line}><Text style={s.lineLabel}>Total pay</Text><Text style={s.lineVal}>{gbp(data.totalPay)}</Text></View>
          <View style={s.line}><Text style={s.lineLabel}>Total tax deducted</Text><Text style={s.lineVal}>{gbp(data.totalTax)}</Text></View>
          <View style={s.line}><Text style={s.lineLabel}>Employee's National Insurance</Text><Text style={s.lineVal}>{gbp(data.totalEeNi)}</Text></View>
        </View>
        <Text style={s.note}>
          This is a record of your pay and deductions for the tax year. Keep it safe — you may need it to claim a tax refund,
          for a tax return, or to apply for tax credits/benefits. This certificate is produced from {data.companyName}&apos;s
          payroll records.
        </Text>
      </Page>
    </Document>
  );
}

export function P45Document({ data }: { data: P45Data }) {
  return (
    <Document title={`P45 — ${data.employeeName}`} author={data.companyName}>
      <Page size="A4" style={s.page}>
        <Header company={data.companyName} title="P45" sub={`Details of employee leaving work`} />
        <EmployeeBlock name={data.employeeName} ni={data.niNumber} code={data.taxCode} year={data.taxYear} />
        <Text style={s.label}>Leaving details</Text>
        <View style={{ marginTop: 6 }}>
          <View style={s.line}><Text style={s.lineLabel}>Leaving date</Text><Text style={s.lineVal}>{data.leavingDate}</Text></View>
          <View style={s.line}><Text style={s.lineLabel}>Total pay to date</Text><Text style={s.lineVal}>{gbp(data.totalPayToDate)}</Text></View>
          <View style={s.line}><Text style={s.lineLabel}>Total tax to date</Text><Text style={s.lineVal}>{gbp(data.totalTaxToDate)}</Text></View>
        </View>
        <Text style={s.note}>
          Give Part 1 to HMRC and Parts 1A/2/3 to the employee. The employee gives Parts 2 and 3 to their new employer (or to
          Jobcentre Plus). Keep Part 1A safe. Produced from {data.companyName}&apos;s payroll records for {data.taxYear}.
        </Text>
      </Page>
    </Document>
  );
}
