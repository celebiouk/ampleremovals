import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export interface ReceiptData {
  leg: "Pickup" | "Delivery";
  companyName: string;
  reference: string;
  serviceType: string;
  customerName: string;
  contactName: string;
  time: string;
  address: string;
  comments: string | null;
  photoCount: number;
  companyPhone: string;
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  header: { backgroundColor: "#6b21a8", color: "#fff", padding: 18, borderRadius: 8, marginBottom: 20 },
  brand: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 6 },
  sub: { color: "#e9d5ff", fontSize: 9, marginTop: 2 },
  box: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 14, marginBottom: 14 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 120, color: "#64748b" },
  value: { flex: 1, fontFamily: "Helvetica-Bold" },
  comments: { backgroundColor: "#f8fafc", borderRadius: 4, padding: 10, marginTop: 6, fontStyle: "italic" },
  footer: { marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e2e8f0", color: "#94a3b8", fontSize: 8 },
});

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>{data.companyName}</Text>
          <Text style={s.title}>{data.leg} Receipt — {data.reference}</Text>
          <Text style={s.sub}>{data.serviceType} · {data.customerName}</Text>
        </View>

        <View style={s.box}>
          <View style={s.row}><Text style={s.label}>{data.leg === "Pickup" ? "Released by" : "Received by"}</Text><Text style={s.value}>{data.contactName || "—"}</Text></View>
          <View style={s.row}><Text style={s.label}>Time</Text><Text style={s.value}>{data.time}</Text></View>
          <View style={s.row}><Text style={s.label}>Location</Text><Text style={s.value}>{data.address || "—"}</Text></View>
          <View style={s.row}><Text style={s.label}>Photos taken</Text><Text style={s.value}>{data.photoCount}</Text></View>
          <View style={s.row}><Text style={s.label}>Signature</Text><Text style={s.value}>Captured &amp; on file</Text></View>
          {data.comments ? <Text style={s.comments}>“{data.comments}”</Text> : null}
        </View>

        <Text style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
          This confirms the items were {data.leg === "Pickup" ? "collected and released for transport" : "delivered and received"} as
          recorded above. A full evidence pack (photos &amp; signature) is retained securely and available on request.
        </Text>

        <Text style={s.footer}>
          {data.companyName} · {data.companyPhone} · Generated {new Date().toLocaleString("en-GB")}
        </Text>
      </Page>
    </Document>
  );
}
