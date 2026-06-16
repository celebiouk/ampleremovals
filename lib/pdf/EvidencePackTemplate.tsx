/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export interface EvidencePackData {
  reference: string;
  serviceType: string;
  customerName: string;
  date: string;
  companyName: string;
  driverNames: string;
  origin: string;
  destination: string;
  pickup: {
    confirmed: boolean;
    contactName: string | null;
    comments: string | null;
    at: string | null;
    photoCount: number;
    hasSignature: boolean;
  };
  delivery: {
    confirmed: boolean;
    contactName: string | null;
    comments: string | null;
    at: string | null;
    photoCount: number;
    hasSignature: boolean;
  };
  completedAt: string | null;
  rating: number | null;
}

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  header: { backgroundColor: "#6b21a8", color: "#fff", padding: 16, borderRadius: 8, marginBottom: 18 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  h1: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 4 },
  sub: { color: "#e9d5ff", fontSize: 9, marginTop: 2 },
  section: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#6b21a8", marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 110, color: "#64748b" },
  value: { flex: 1, fontFamily: "Helvetica-Bold" },
  comments: { backgroundColor: "#f8fafc", borderRadius: 4, padding: 8, marginTop: 4, fontStyle: "italic" },
  badge: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e2e8f0", color: "#94a3b8", fontSize: 8 },
});

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || "—"}</Text>
    </View>
  );
}

export function EvidencePackDocument({ data }: { data: EvidencePackData }) {
  const leg = (l: EvidencePackData["pickup"]) => (
    <>
      <Line label="Status" value={l.confirmed ? "Confirmed" : "Not confirmed"} />
      <Line label="Time" value={l.at || "—"} />
      <Line label="Released/Received by" value={l.contactName || "—"} />
      <Line label="Photos" value={`${l.photoCount} on file`} />
      <Line label="Signature" value={l.hasSignature ? "On file" : "—"} />
      {l.comments ? <Text style={s.comments}>“{l.comments}”</Text> : null}
    </>
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>{data.companyName}</Text>
          <Text style={s.h1}>Job Evidence Pack — {data.reference}</Text>
          <Text style={s.sub}>{data.serviceType} · {data.customerName} · {data.date}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Job Summary</Text>
          <Line label="Reference" value={data.reference} />
          <Line label="Customer" value={data.customerName} />
          <Line label="Crew" value={data.driverNames} />
          <Line label="From" value={data.origin} />
          <Line label="To" value={data.destination} />
          {data.completedAt ? <Line label="Completed" value={data.completedAt} /> : null}
          {data.rating != null ? <Line label="Customer rating" value={`${data.rating} / 5`} /> : null}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Pickup — Chain of Custody</Text>
          {leg(data.pickup)}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery — Chain of Custody</Text>
          {leg(data.delivery)}
        </View>

        <Text style={s.footer}>
          This evidence pack records the digital chain of custody for this job. Photographs and signatures
          are retained securely in the Ample Removals system and available on request. Generated {new Date().toLocaleString("en-GB")}.
        </Text>
      </Page>
    </Document>
  );
}
