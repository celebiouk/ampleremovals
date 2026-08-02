import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

/**
 * A payment receipt — issued once a customer has paid (in full or a stated
 * amount) for a service. Mirrors the invoice layout so the two read as a set,
 * but is unmistakably a "PAID" document: green accents, a RECEIPT title, and a
 * prominent "Amount Paid" figure. Purely a record of money received.
 */
export interface PaymentReceiptData {
  receiptNumber: string;
  receiptDate: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  bookingReference: string;
  serviceType: string;
  moveDate: string;
  description: string;
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}

const PURPLE = "#6b21a8";
const GREEN = "#16a34a";
const GREEN_DARK = "#166534";
const GREEN_LIGHT = "#f0fdf4";
const GREY = "#64748b";
const LIGHT_GREY = "#f8fafc";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", padding: 40, backgroundColor: "#ffffff" },
  row: { flexDirection: "row" },
  logo: { width: 50, height: 50, marginBottom: 8, borderRadius: 8 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PURPLE, marginBottom: 3 },
  companyDetail: { fontSize: 9, color: GREY, marginBottom: 1 },
  receiptTitle: { fontSize: 42, fontFamily: "Helvetica-Bold", color: GREEN, letterSpacing: 2 },
  receiptNumber: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 6 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 4, marginBottom: 2 },
  metaLabel: { fontSize: 8, color: GREY },
  metaValue: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  paidBadge: { backgroundColor: GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginTop: 6 },
  paidText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1 },
  divider: { borderBottomWidth: 2, borderBottomColor: GREEN, marginVertical: 16 },
  sectionLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: GREY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  billToName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  billToDetail: { fontSize: 9, color: GREY, marginBottom: 1 },
  bookingPill: { backgroundColor: LIGHT_GREY, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, alignSelf: "flex-end" },
  bookingPillText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PURPLE },
  banner: { backgroundColor: GREEN_LIGHT, borderRadius: 4, padding: 8, marginVertical: 12, borderWidth: 1, borderColor: "#bbf7d0" },
  bannerText: { fontSize: 8, lineHeight: 1.4 },
  // Amount block — the headline of the receipt
  amountBlock: { backgroundColor: GREEN_LIGHT, borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 8, padding: 16, marginTop: 8 },
  amountLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GREEN_DARK, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  amountValue: { fontSize: 30, fontFamily: "Helvetica-Bold", color: GREEN_DARK },
  // Detail rows
  detailBox: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 14, marginTop: 12 },
  detailRow: { flexDirection: "row", marginBottom: 6 },
  detailLabel: { width: 130, color: GREY, fontSize: 9 },
  detailValue: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 9 },
  notesSection: { marginTop: 12 },
  notesBox: { backgroundColor: LIGHT_GREY, borderRadius: 4, padding: 8 },
  notesText: { fontSize: 9, color: GREY, lineHeight: 1.5 },
  thanks: { marginTop: 16, fontSize: 10, color: "#475569", lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: GREEN, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: GREY },
});

export function PaymentReceiptDocument({ data }: { data: PaymentReceiptData }) {
  const {
    receiptNumber, receiptDate, companyName, companyAddress, companyPhone, companyEmail,
    customerName, customerEmail, customerPhone, customerAddress,
    bookingReference, serviceType, moveDate,
    description, amountPaid, paymentMethod, paymentDate, notes,
  } = data;

  return (
    <Document title={`Receipt ${receiptNumber}`} author={companyName}>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.row}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.ampleremovals.com"}/logo.png`}
              style={styles.logo}
            />
            <Text style={styles.companyName}>{companyName}</Text>
            {companyAddress.split("\n").map((line, i) => (
              <Text key={i} style={styles.companyDetail}>{line}</Text>
            ))}
            <Text style={styles.companyDetail}>{companyPhone}</Text>
            <Text style={styles.companyDetail}>{companyEmail}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.receiptTitle}>RECEIPT</Text>
            <Text style={styles.receiptNumber}>{receiptNumber}</Text>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Receipt Date:  </Text><Text style={styles.metaValue}>{receiptDate}</Text></View>
            <View style={styles.paidBadge}><Text style={styles.paidText}>PAID</Text></View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* RECEIVED FROM */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>Received From</Text>
            <Text style={styles.billToName}>{(customerName || "").toUpperCase()}</Text>
            {customerEmail ? <Text style={styles.billToDetail}>{customerEmail}</Text> : null}
            {customerPhone ? <Text style={styles.billToDetail}>{customerPhone}</Text> : null}
            {customerAddress ? <Text style={styles.billToDetail}>{customerAddress}</Text> : null}
          </View>
          <View style={{ alignItems: "flex-end", flex: 1 }}>
            <View style={styles.bookingPill}>
              <Text style={styles.bookingPillText}>Booking: {bookingReference}</Text>
            </View>
            <Text style={[styles.billToDetail, { textAlign: "right" }]}>Service: {serviceType}</Text>
            <Text style={[styles.billToDetail, { textAlign: "right" }]}>Move Date: {moveDate}</Text>
          </View>
        </View>

        {/* CONFIRMATION BANNER */}
        <View style={styles.banner}>
          <Text style={[styles.bannerText, { color: GREEN_DARK, fontFamily: "Helvetica-Bold" }]}>PAYMENT RECEIVED</Text>
          <Text style={[styles.bannerText, { color: "#15803d" }]}>
            This confirms we have received the payment shown below for the service above. Thank you.
          </Text>
        </View>

        {/* AMOUNT PAID — headline */}
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>£{amountPaid.toFixed(2)}</Text>
        </View>

        {/* PAYMENT DETAILS */}
        <View style={styles.detailBox}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>For</Text><Text style={styles.detailValue}>{description}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Payment Method</Text><Text style={styles.detailValue}>{paymentMethod}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Payment Date</Text><Text style={styles.detailValue}>{paymentDate}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Booking Reference</Text><Text style={styles.detailValue}>{bookingReference}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Receipt Number</Text><Text style={styles.detailValue}>{receiptNumber}</Text></View>
        </View>

        {/* NOTES */}
        {notes ? (
          <View style={styles.notesSection}>
            <Text style={[styles.sectionLabel]}>Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.thanks}>
          Thank you for choosing {companyName}. Please keep this receipt for your records.
        </Text>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{companyName} · {companyPhone}</Text>
          <Text style={styles.footerText}>{receiptNumber} | Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
