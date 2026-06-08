import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { InvoicePDFData } from "@/types";

const PURPLE = "#6b21a8";
const PURPLE_LIGHT = "#f5f3ff";
const GREEN = "#16a34a";
const RED = "#dc2626";
const AMBER = "#d97706";
const GREY = "#64748b";
const LIGHT_GREY = "#f8fafc";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", padding: 40, backgroundColor: "#ffffff" },
  row: { flexDirection: "row" },
  // Header
  logo: { width: 50, height: 50, marginBottom: 8, borderRadius: 8 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PURPLE, marginBottom: 3 },
  companyDetail: { fontSize: 9, color: GREY, marginBottom: 1 },
  invoiceTitle: { fontSize: 42, fontFamily: "Helvetica-Bold", color: PURPLE, letterSpacing: 2 },
  invoiceNumber: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 6 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 4, marginBottom: 2 },
  metaLabel: { fontSize: 8, color: GREY },
  metaValue: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  // Status badge
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 6 },
  statusText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  // Divider
  divider: { borderBottomWidth: 2, borderBottomColor: PURPLE, marginVertical: 16 },
  thinDivider: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginVertical: 8 },
  // Bill to
  sectionLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: GREY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  billToName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  billToDetail: { fontSize: 9, color: GREY, marginBottom: 1 },
  bookingPill: { backgroundColor: LIGHT_GREY, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, alignSelf: "flex-end" },
  bookingPillText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PURPLE },
  // Banner
  depositBanner: { backgroundColor: "#fef3c7", borderRadius: 4, padding: 8, marginVertical: 10 },
  balanceBanner: { backgroundColor: PURPLE_LIGHT, borderRadius: 4, padding: 8, marginVertical: 10 },
  bannerText: { fontSize: 8, lineHeight: 1.4 },
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
  totalsBlock: { marginTop: 8, alignSelf: "flex-end", width: 200 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsLabel: { fontSize: 9, color: GREY },
  totalsValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalsDivider: { borderBottomWidth: 1, borderBottomColor: PURPLE, marginVertical: 4 },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: PURPLE },
  totalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: PURPLE },
  // Payment instructions
  paySection: { marginTop: 16 },
  payHeading: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PURPLE, marginBottom: 6 },
  payDetail: { fontSize: 9, color: GREY, marginBottom: 2 },
  payLink: { fontSize: 9, color: PURPLE, marginBottom: 8 },
  bankBox: { backgroundColor: LIGHT_GREY, borderRadius: 4, padding: 8, marginTop: 4 },
  bankRow: { flexDirection: "row", marginBottom: 2 },
  bankLabel: { fontSize: 8, color: GREY, width: 80 },
  bankValue: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  // Notes
  notesSection: { marginTop: 12 },
  notesBox: { backgroundColor: LIGHT_GREY, borderRadius: 4, padding: 8 },
  notesText: { fontSize: 9, color: GREY, lineHeight: 1.5 },
  // Footer
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: PURPLE, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: GREY },
});

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; label: string }> = {
    paid: { bg: GREEN, label: "PAID" },
    sent: { bg: PURPLE, label: "OUTSTANDING" },
    overdue: { bg: RED, label: "OVERDUE" },
    draft: { bg: GREY, label: "DRAFT" },
    cancelled: { bg: RED, label: "CANCELLED" },
  };
  const { bg, label } = cfg[status] ?? { bg: GREY, label: status.toUpperCase() };
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

interface Props { data: InvoicePDFData }

export function InvoiceDocument({ data }: Props) {
  const {
    invoiceNumber, invoiceDate, dueDate, status, type,
    companyName, companyAddress, companyPhone, companyEmail,
    customerName, customerEmail, customerPhone, originAddress,
    bookingReference, serviceType, moveDate,
    lineItems, subtotal, vatRate, vatAmount, total,
    notes,
    fullJobValue, depositPercentage, balanceRemaining,
  } = data;

  return (
    <Document title={`Invoice ${invoiceNumber}`} author={companyName}>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.row}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ampleremovals.com'}/logo.png`}
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
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Invoice Date:  </Text><Text style={styles.metaValue}>{invoiceDate}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Due Date:  </Text><Text style={styles.metaValue}>{dueDate}</Text></View>
            <StatusBadge status={status} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* BILL TO */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.billToName}>{customerName}</Text>
            <Text style={styles.billToDetail}>{customerEmail}</Text>
            <Text style={styles.billToDetail}>{customerPhone}</Text>
            <Text style={styles.billToDetail}>{originAddress}</Text>
          </View>
          <View style={{ alignItems: "flex-end", flex: 1 }}>
            <View style={styles.bookingPill}>
              <Text style={styles.bookingPillText}>Booking: {bookingReference}</Text>
            </View>
            <Text style={[styles.billToDetail, { textAlign: "right" }]}>Service: {serviceType}</Text>
            <Text style={[styles.billToDetail, { textAlign: "right" }]}>Move Date: {moveDate}</Text>
          </View>
        </View>

        {/* INVOICE TYPE BANNER */}
        {type === "deposit" ? (
          <View style={styles.depositBanner}>
            <Text style={[styles.bannerText, { color: AMBER, fontFamily: "Helvetica-Bold" }]}>DEPOSIT INVOICE</Text>
            <Text style={[styles.bannerText, { color: "#92400e" }]}>
              This is a deposit to confirm your booking. The remaining balance will be invoiced separately.
            </Text>
          </View>
        ) : (
          <View style={styles.balanceBanner}>
            <Text style={[styles.bannerText, { color: PURPLE, fontFamily: "Helvetica-Bold" }]}>FINAL BALANCE INVOICE</Text>
            <Text style={[styles.bannerText, { color: "#5b21b6" }]}>
              This is the final balance invoice for your completed service.
            </Text>
          </View>
        )}

        {/* LINE ITEMS TABLE */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.descCol]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.priceCol]}>Unit Price</Text>
          <Text style={[styles.tableHeaderCell, styles.totalCol]}>Total</Text>
        </View>
        {lineItems.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, styles.descCol]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.qtyCol]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.priceCol]}>£{item.unit_price.toFixed(2)}</Text>
            <Text style={[styles.tableCell, styles.totalCol]}>£{item.total.toFixed(2)}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={styles.totalsBlock}>
          {/* For deposit invoices — show full job breakdown */}
          {type === "deposit" && fullJobValue && fullJobValue > 0 ? (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Full Job Price</Text>
                <Text style={styles.totalsValue}>£{fullJobValue.toFixed(2)}</Text>
              </View>
              {vatRate > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>VAT ({vatRate}%)</Text>
                  <Text style={styles.totalsValue}>£{vatAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.totalsDivider} />
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: "#92400e" }]}>
                  Deposit Due Now{depositPercentage ? ` (${depositPercentage}%)` : ""}
                </Text>
                <Text style={[styles.totalsValue, { color: "#92400e" }]}>£{total.toFixed(2)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Balance Remaining</Text>
                <Text style={styles.totalsValue}>£{(balanceRemaining ?? (fullJobValue - total)).toFixed(2)}</Text>
              </View>
              <View style={styles.totalsDivider} />
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>PAY NOW</Text>
                <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>£{subtotal.toFixed(2)}</Text>
              </View>
              {vatRate > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>VAT ({vatRate}%)</Text>
                  <Text style={styles.totalsValue}>£{vatAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.totalsDivider} />
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>TOTAL DUE</Text>
                <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* PAYMENT INSTRUCTIONS */}
        <View style={styles.paySection}>
          <Text style={styles.payHeading}>How to Pay</Text>
          <Text style={styles.payDetail}>Please pay by bank transfer to:</Text>
          <View style={styles.bankBox}>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>Account Name</Text><Text style={styles.bankValue}>Ample Removals</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>Sort Code</Text><Text style={styles.bankValue}>04-00-04</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>Account #</Text><Text style={styles.bankValue}>11756714</Text></View>
            <View style={styles.bankRow}><Text style={styles.bankLabel}>Reference</Text><Text style={styles.bankValue}>{invoiceNumber}</Text></View>
          </View>
          <Text style={[styles.payDetail, { marginTop: 6 }]}>Please use your invoice number as the payment reference.</Text>
        </View>

        {/* NOTES */}
        {notes && (
          <View style={styles.notesSection}>
            <Text style={[styles.payHeading, { fontSize: 9 }]}>Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Thank you for choosing {companyName}</Text>
          <Text style={styles.footerText}>{invoiceNumber} | Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
