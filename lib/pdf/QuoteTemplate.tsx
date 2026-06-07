import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PURPLE = "#6b21a8";
const GREEN = "#16a34a";
const AMBER = "#d97706";
const GREY = "#64748b";
const LIGHT_GREY = "#f8fafc";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", padding: 40, backgroundColor: "#ffffff" },
  row: { flexDirection: "row" },
  // Header
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PURPLE, marginBottom: 3 },
  companyDetail: { fontSize: 9, color: GREY, marginBottom: 1 },
  quoteTitle: { fontSize: 42, fontFamily: "Helvetica-Bold", color: PURPLE, letterSpacing: 2 },
  quoteRef: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 6 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 4, marginBottom: 2 },
  metaLabel: { fontSize: 8, color: GREY },
  metaValue: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  divider: { borderBottomWidth: 2, borderBottomColor: PURPLE, marginVertical: 16 },
  // Validity badge
  validBadge: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: GREEN, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-end", marginTop: 6 },
  validText: { fontSize: 8, color: GREEN, fontFamily: "Helvetica-Bold" },
  // Sections
  sectionLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: GREY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  customerName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  customerDetail: { fontSize: 9, color: GREY, marginBottom: 1 },
  bookingPill: { backgroundColor: LIGHT_GREY, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, alignSelf: "flex-end" },
  bookingPillText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PURPLE },
  // Quote banner
  quoteBanner: { backgroundColor: "#ede9fe", borderRadius: 4, padding: 10, marginVertical: 10 },
  quoteBannerText: { fontSize: 9, color: "#5b21b6", lineHeight: 1.5 },
  // Table
  tableHeader: { flexDirection: "row", backgroundColor: PURPLE, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 2 },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8 },
  tableRowAlt: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, backgroundColor: LIGHT_GREY },
  tableCell: { fontSize: 9 },
  descCol: { flex: 4 },
  qtyCol: { flex: 1, textAlign: "center" },
  priceCol: { flex: 2, textAlign: "right" },
  totalCol: { flex: 2, textAlign: "right" },
  // Totals
  totalsBlock: { marginTop: 8, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsLabel: { fontSize: 9, color: GREY },
  totalsValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalsDivider: { borderBottomWidth: 1, borderBottomColor: PURPLE, marginVertical: 4 },
  totalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: PURPLE },
  totalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: PURPLE },
  // Notes
  notesSection: { marginTop: 14 },
  notesBox: { backgroundColor: LIGHT_GREY, borderRadius: 4, padding: 8 },
  notesText: { fontSize: 9, color: GREY, lineHeight: 1.5 },
  // Next steps
  nextSteps: { marginTop: 14 },
  nextHeading: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PURPLE, marginBottom: 6 },
  nextItem: { flexDirection: "row", marginBottom: 4 },
  nextNum: { fontSize: 9, fontFamily: "Helvetica-Bold", color: PURPLE, width: 16 },
  nextText: { fontSize: 9, color: GREY, flex: 1, lineHeight: 1.4 },
  // Footer
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: PURPLE, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: GREY },
});

import type { QuotePDFData } from "@/types";

export function QuoteDocument({ data }: { data: QuotePDFData }) {
  return (
    <Document title={`Quote ${data.quote_number}`} author="Ample Removals">
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>Ample Removals</Text>
            <Text style={styles.companyDetail}>London's Premier Moving & Cleaning Services</Text>
            <Text style={styles.companyDetail}>Phone: 020 XXXX XXXX</Text>
            <Text style={styles.companyDetail}>Email: bookings@ampleremovals.co.uk</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteRef}>{data.quote_number}</Text>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Date:  </Text><Text style={styles.metaValue}>{data.date}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Valid Until:  </Text><Text style={styles.metaValue}>{data.valid_until}</Text></View>
            <View style={styles.validBadge}><Text style={styles.validText}>✓ VALID QUOTE</Text></View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* PREPARED FOR */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>Prepared For</Text>
            <Text style={styles.customerName}>{data.customer_name}</Text>
            <Text style={styles.customerDetail}>{data.customer_email}</Text>
            <Text style={styles.customerDetail}>{data.customer_phone}</Text>
            <Text style={styles.customerDetail}>{data.origin_address}</Text>
            {data.destination_address && <Text style={styles.customerDetail}>→ {data.destination_address}</Text>}
          </View>
          <View style={{ alignItems: "flex-end", flex: 1 }}>
            <View style={styles.bookingPill}><Text style={styles.bookingPillText}>{data.service_type.toUpperCase()}</Text></View>
          </View>
        </View>

        {/* BANNER */}
        <View style={styles.quoteBanner}>
          <Text style={[styles.quoteBannerText, { fontFamily: "Helvetica-Bold", color: "#4c1d95" }]}>THIS IS A QUOTE — NOT AN INVOICE</Text>
          <Text style={styles.quoteBannerText}>
            This quote outlines the full cost of your {data.service_type} service. To confirm your booking, simply accept this quote and we'll send you a deposit invoice. Prices are valid until {data.valid_until}.
          </Text>
        </View>

        {/* LINE ITEMS */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.descCol]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.priceCol]}>Unit Price</Text>
          <Text style={[styles.tableHeaderCell, styles.totalCol]}>Total</Text>
        </View>
        {data.line_items.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, styles.descCol]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.qtyCol]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.priceCol]}>£{item.unit_price.toFixed(2)}</Text>
            <Text style={[styles.tableCell, styles.totalCol]}>£{item.total.toFixed(2)}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>£{data.subtotal.toFixed(2)}</Text>
          </View>
          {data.vat_rate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT ({data.vat_rate}%)</Text>
              <Text style={styles.totalsValue}>£{data.vat_amount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalsDivider} />
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>TOTAL QUOTED</Text>
            <Text style={styles.totalValue}>£{data.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* NOTES */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={[styles.nextHeading, { fontSize: 9 }]}>Notes</Text>
            <View style={styles.notesBox}><Text style={styles.notesText}>{data.notes}</Text></View>
          </View>
        )}

        {/* NEXT STEPS */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextHeading}>How to Accept This Quote</Text>
          {[
            "Review the details above and confirm everything is correct.",
            "Call us on 020 XXXX XXXX or reply to the email to confirm you'd like to proceed.",
            "We will send you a deposit invoice to secure your booking.",
            "Once the deposit is paid, your booking is confirmed and we'll be in touch with arrival details.",
          ].map((step, i) => (
            <View key={i} style={styles.nextItem}>
              <Text style={styles.nextNum}>{i + 1}.</Text>
              <Text style={styles.nextText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Thank you for choosing Ample Removals</Text>
          <Text style={styles.footerText}>{data.quote_number} | Valid until {data.valid_until}</Text>
        </View>
      </Page>
    </Document>
  );
}
