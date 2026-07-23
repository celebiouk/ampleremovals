/**
 * Auto full-balance invoice — fired when the driver confirms arrival at the
 * PICKUP. It bills the remaining balance the customer owes:
 *
 *     full balance (gross) = last quote total  −  confirmed deposit paid
 *
 * VAT mirrors the quote: if the quote was raised WITH VAT, the balance is shown
 * as ex-VAT subtotal + VAT; if the quote had no VAT, the invoice has none.
 *
 * Best-effort + idempotent: it never throws to the caller (arrival must always
 * succeed) and skips if a full-balance invoice already exists or nothing is owed.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
import { uploadInvoicePDF, getInvoiceSignedURL, downloadInvoicePDF } from "@/lib/storage";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { generateInvoiceNumber, formatDate, formatCurrency } from "@/lib/utils";
import { SERVICE_LABELS } from "@/lib/constants";
import type { ServiceType, InvoicePDFData } from "@/types";

const round2 = (n: number) => Math.round(n * 100) / 100;

type Result = { sent: boolean; reason?: string; invoiceNumber?: string; total?: number };

export async function autoSendFullBalanceInvoice(bookingId: string): Promise<Result> {
  try {
    const supabase = createAdminClient();

    // Already a full-balance invoice on this booking? Don't double-bill.
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("type", "full_balance")
      .neq("status", "cancelled")
      .maybeSingle();
    if (existing) return { sent: false, reason: "full_balance invoice already exists" };

    // Booking + quote figures + customer + pickup address.
    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        id, reference, service_type, status, move_date, is_flexible_date,
        flexible_date_from, flexible_date_to, customer_id,
        quote_total, quote_subtotal, quote_vat_rate,
        customers!inner(full_name, email, phone),
        origin_addr:addresses!origin_address_id(line_1, line_2, city, postcode)
      `)
      .eq("id", bookingId)
      .single();
    if (!booking) return { sent: false, reason: "booking not found" };

    const quoteTotal = Number(booking.quote_total ?? 0);
    if (!quoteTotal || quoteTotal <= 0) return { sent: false, reason: "no quote total to bill against" };

    // Confirmed deposit = sum of PAID deposit invoices for this booking.
    const { data: paidDeposits } = await supabase
      .from("invoices")
      .select("total")
      .eq("booking_id", bookingId)
      .eq("type", "deposit")
      .eq("status", "paid");
    const depositPaid = round2((paidDeposits ?? []).reduce((a, d) => a + Number(d.total ?? 0), 0));

    // Remaining gross owed.
    const grossRemaining = round2(quoteTotal - depositPaid);
    if (grossRemaining <= 0) return { sent: false, reason: "balance already covered by deposit" };

    // VAT mirrors the quote. If the quote carried VAT, decompose the gross
    // remaining into ex-VAT subtotal + VAT; otherwise no VAT.
    const vatRate = Number(booking.quote_vat_rate ?? 0) > 0 ? 20 : 0;
    const subtotal = vatRate > 0 ? round2(grossRemaining / (1 + vatRate / 100)) : grossRemaining;
    const vatAmount = round2(grossRemaining - subtotal);
    const total = grossRemaining;

    const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as
      { full_name: string; email: string; phone: string } | null;
    if (!customer) return { sent: false, reason: "customer not found" };

    const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;
    const lineItems = [{
      description: `Final balance — ${serviceLabel}${depositPaid > 0 ? " (after deposit)" : ""}`,
      quantity: 1,
      unit_price: subtotal,
      total: subtotal,
    }];

    // Unique invoice number.
    let invoiceNumber = "";
    for (let i = 0; i < 10; i++) {
      const candidate = generateInvoiceNumber();
      const { data: clash } = await supabase.from("invoices").select("id").eq("invoice_number", candidate).maybeSingle();
      if (!clash) { invoiceNumber = candidate; break; }
    }
    if (!invoiceNumber) return { sent: false, reason: "could not allocate invoice number" };

    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Insert the invoice (sent straight away — this is an automatic send).
    const { data: invoice, error: insErr } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        booking_id: bookingId,
        customer_id: booking.customer_id,
        type: "full_balance",
        status: "draft",
        line_items: lineItems,
        subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
        due_date: dueDate,
        notes: depositPaid > 0
          ? `Balance remaining after deposit of ${formatCurrency(depositPaid)}. Quote total ${formatCurrency(quoteTotal)}.`
          : `Full balance. Quote total ${formatCurrency(quoteTotal)}.`,
        full_job_value: quoteTotal,
        balance_remaining: total,
      })
      .select("id")
      .single();
    if (insErr || !invoice) return { sent: false, reason: `insert failed: ${insErr?.message}` };
    const invoiceId = invoice.id as string;

    // Company settings for the PDF.
    const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
    const originAddr = (Array.isArray(booking.origin_addr) ? booking.origin_addr[0] : booking.origin_addr) as
      { line_1: string; line_2?: string | null; city?: string | null; postcode: string } | null;
    const originAddress = originAddr
      ? [originAddr.line_1, originAddr.line_2, originAddr.city, originAddr.postcode].filter(Boolean).join(", ")
      : "";
    const moveDate = booking.is_flexible_date
      ? `Flexible: ${formatDate(booking.flexible_date_from ?? "")} – ${formatDate(booking.flexible_date_to ?? "")}`
      : booking.move_date ? formatDate(booking.move_date) : "TBC";

    const pdfData: InvoicePDFData = {
      invoiceNumber,
      invoiceDate: formatDate(new Date()),
      dueDate: formatDate(dueDate),
      status: "sent",
      type: "full_balance",
      companyName: settings?.company_name ?? "Ample Removals",
      companyAddress: settings?.company_address ?? "",
      companyPhone: settings?.company_phone ?? "0333 577 2070",
      companyEmail: settings?.company_email ?? "",
      customerName: customer.full_name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      originAddress,
      bookingReference: booking.reference,
      serviceType: serviceLabel,
      moveDate,
      lineItems,
      subtotal,
      vatRate,
      vatAmount,
      total,
      notes: undefined,
      fullJobValue: quoteTotal,
      balanceRemaining: total,
    };

    // PDF (best-effort — failure doesn't stop the send).
    let pdfUrl = "";
    try {
      const buf = await generateInvoicePDF(pdfData);
      await uploadInvoicePDF(bookingId, invoiceId, buf);
      pdfUrl = await getInvoiceSignedURL(bookingId, invoiceId);
      await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoiceId);
    } catch (e) {
      console.error("auto full-invoice PDF failed:", e);
    }

    const companyPhone = settings?.company_phone ?? "0333 577 2070";
    const first = customer.full_name.split(" ")[0];

    // Email (with PDF attached if we have it) — mirrors the manual invoice email.
    try {
      const attachments: { filename: string; content: string }[] = [];
      if (pdfUrl) {
        try {
          const buf = await downloadInvoicePDF(bookingId, invoiceId);
          attachments.push({ filename: `${invoiceNumber}.pdf`, content: buf.toString("base64") });
        } catch { /* attachment optional */ }
      }
      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: `Final Balance Invoice ${invoiceNumber} — ${booking.reference}`,
        html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Final Balance Invoice</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
            <p style="color:#1e293b;">Hi ${first},</p>
            <p style="color:#475569;line-height:1.6;">Your driver has arrived for your move. Please find your <strong>final balance</strong> invoice attached.</p>
            <div style="border:2px solid #6b21a8;border-radius:10px;padding:16px;margin:20px 0;background:#faf5ff;">
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#64748b;padding:4px 0;">Invoice Number</td><td style="font-weight:bold;text-align:right;">${invoiceNumber}</td></tr>
                ${depositPaid > 0 ? `<tr><td style="color:#64748b;padding:4px 0;">Quote Total</td><td style="text-align:right;">${formatCurrency(quoteTotal)}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0;">Deposit Paid</td><td style="text-align:right;">− ${formatCurrency(depositPaid)}</td></tr>` : ""}
                ${vatRate > 0 ? `<tr><td style="color:#64748b;padding:4px 0;">Subtotal</td><td style="text-align:right;">${formatCurrency(subtotal)}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0;">VAT (20%)</td><td style="text-align:right;">${formatCurrency(vatAmount)}</td></tr>` : ""}
                <tr><td style="color:#64748b;padding:4px 0;">Balance Due</td><td style="font-weight:bold;text-align:right;color:#6b21a8;">${formatCurrency(total)}</td></tr>
              </table>
            </div>
            <div style="background:#f8fafc;border-radius:10px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
              <h3 style="margin:0 0 12px 0;color:#1e293b;font-size:15px;">Bank Transfer Details</h3>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#64748b;padding:6px 0;">Account Name</td><td style="font-weight:600;text-align:right;">AMPLE LOGISTICS LIMITED</td></tr>
                <tr><td style="color:#64748b;padding:6px 0;">Sort Code</td><td style="font-weight:600;text-align:right;">30-54-66</td></tr>
                <tr><td style="color:#64748b;padding:6px 0;">Account Number</td><td style="font-weight:600;text-align:right;">12963462</td></tr>
                <tr><td style="color:#64748b;padding:6px 0;">Reference</td><td style="font-weight:600;text-align:right;color:#6b21a8;">${invoiceNumber}</td></tr>
              </table>
              <p style="color:#64748b;font-size:12px;margin:12px 0 0 0;">⚠️ Please use your invoice number as the payment reference</p>
            </div>
            <p style="color:#475569;font-size:13px;">Any questions? Call us on ${companyPhone}.</p>
          </div>
        </body></html>`,
        ...(attachments.length ? { attachments } : {}),
      } as Parameters<typeof resend.emails.send>[0]);
    } catch (e) {
      console.error("auto full-invoice email failed:", e);
    }

    // SMS + WhatsApp (the owner's "send a message" = email + SMS + WhatsApp).
    const smsBody = `Ample Removals: Your final balance invoice ${invoiceNumber} (${formatCurrency(total)}) has been emailed - pay by bank transfer, details inside. Questions? Call ${companyPhone}. Ref ${booking.reference}`;
    await sendSMS(customer.phone, smsBody).catch(() => {});
    await sendWhatsApp(
      customer.phone,
      `Hi ${first}! Your driver has arrived. 📄 Your *final balance* invoice *${invoiceNumber}* for *${formatCurrency(total)}* is in your email.\n\nPay by bank transfer (details in the email).\n\nRef: ${booking.reference}`,
      { name: "final_invoice_sent", variables: { "1": first, "2": invoiceNumber, "3": formatCurrency(total), "4": booking.reference } },
    ).catch(() => {});

    // Mark sent + advance the booking to "Full Invoice Sent".
    await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoiceId);

    if (booking.status !== "full_invoice_sent") {
      await supabase.from("bookings").update({ status: "full_invoice_sent" }).eq("id", bookingId);
      await supabase.from("status_history").insert({
        booking_id: bookingId,
        previous_status: booking.status ?? null,
        new_status: "full_invoice_sent",
        changed_by: "system",
        reason: "Full balance invoice auto-sent on pickup arrival",
      });
    }

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Full balance invoice ${invoiceNumber} auto-sent on pickup arrival`,
      metadata: { invoiceId, invoiceNumber, total, depositPaid, quoteTotal, vatRate },
      performed_by: "system",
    });

    try {
      await supabase.from("notifications").insert({
        type: "invoice_sent",
        title: "Final balance invoice sent",
        description: `${invoiceNumber} — ${formatCurrency(total)} auto-sent to ${customer.full_name} on pickup arrival.`,
        booking_id: bookingId,
      });
    } catch { /* non-critical */ }

    return { sent: true, invoiceNumber, total };
  } catch (e) {
    console.error("autoSendFullBalanceInvoice failed:", e);
    return { sent: false, reason: e instanceof Error ? e.message : "unknown error" };
  }
}
