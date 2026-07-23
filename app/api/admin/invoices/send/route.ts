import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { twilioClient, twilioFrom, normaliseSmsBody } from "@/lib/twilio";
import { normaliseUKPhone, formatDate, formatCurrency } from "@/lib/utils";
import { downloadInvoicePDF, getInvoiceSignedURL, uploadInvoicePDF } from "@/lib/storage";
import { logError } from "@/lib/log-error";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
import { SERVICE_LABELS } from "@/lib/constants";
import type { ServiceType, InvoicePDFData } from "@/types";

export const runtime = "nodejs";

const schema = z.object({ invoiceId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });

  const { invoiceId } = parsed.data;
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, bookings!inner(id, reference, service_type, status, customer_id, customers!inner(full_name, email, phone))")
    .eq("id", invoiceId)
    .single();

  if (!invoice || invoice.status === "cancelled") {
    return NextResponse.json({ success: false, error: "Invoice not found or cancelled" }, { status: 400 });
  }

  const booking = invoice.bookings as { id: string; reference: string; service_type: string; status: string; customer_id: string; customers: { full_name: string; email: string; phone: string } };
  const customer = booking.customers;

  // Fetch full booking details for PDF regeneration
  const { data: fullBooking } = await supabase
    .from("bookings")
    .select("id, reference, service_type, move_date, is_flexible_date, flexible_date_from, flexible_date_to, origin_addr:addresses!origin_address_id(line_1, line_2, city, postcode)")
    .eq("id", booking.id)
    .single();

  const originAddr = fullBooking && (Array.isArray(fullBooking.origin_addr) ? fullBooking.origin_addr[0] : fullBooking.origin_addr) as { line_1: string; line_2?: string | null; city?: string | null; postcode: string } | null;
  const originAddress = originAddr ? [originAddr.line_1, originAddr.line_2, originAddr.city, originAddr.postcode].filter(Boolean).join(", ") : "";
  const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;
  const moveDate = fullBooking && fullBooking.is_flexible_date
    ? `Flexible: ${formatDate(fullBooking.flexible_date_from ?? "")} – ${formatDate(fullBooking.flexible_date_to ?? "")}`
    : fullBooking && fullBooking.move_date ? formatDate(fullBooking.move_date) : "TBC";

  // Get company settings
  const { data: companySettings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const companyName = companySettings?.company_name ?? "Ample Removals";
  const companyAddress = companySettings?.company_address ?? "";
  const companyPhone = companySettings?.company_phone ?? "0333 577 2070";
  const companyEmail = companySettings?.company_email ?? "hello@ampleremovals.com";

  // Regenerate PDF with "sent" status
  console.log("📄 Regenerating PDF with 'sent' status for invoice:", invoiceId);
  let pdfUrl = "";
  try {
    const pdfData: InvoicePDFData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: formatDate(invoice.created_at),
      dueDate: formatDate(invoice.due_date),
      status: "sent", // Important: Change status from draft to sent
      type: invoice.type,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      customerName: customer.full_name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      originAddress,
      bookingReference: booking.reference,
      serviceType: serviceLabel,
      moveDate,
      lineItems: invoice.line_items,
      subtotal: invoice.subtotal,
      vatRate: invoice.vat_rate,
      vatAmount: invoice.vat_amount,
      total: invoice.total,
      notes: invoice.notes,
      fullJobValue: invoice.full_job_value,
      depositPercentage: invoice.deposit_percentage,
      balanceRemaining: invoice.balance_remaining,
    };

    const pdfBuffer = await generateInvoicePDF(pdfData);
    console.log("✅ PDF regenerated with 'sent' status, size:", pdfBuffer.length, "bytes");

    // Upload new PDF (overwrites draft version)
    await uploadInvoicePDF(booking.id, invoiceId, pdfBuffer);
    pdfUrl = await getInvoiceSignedURL(booking.id, invoiceId);
    console.log("✅ PDF uploaded and signed URL generated");

    // Update invoice record with new PDF URL
    await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoiceId);
  } catch (pdfErr) {
    console.error("❌ PDF regeneration failed:", pdfErr);
    await logError({ message: `PDF regeneration failed for send: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`, metadata: { invoiceId } });
    // Try to use existing PDF if regeneration fails
    try {
      pdfUrl = await getInvoiceSignedURL(booking.id, invoiceId);
    } catch { /* No PDF available */ }
  }

  const typeLabel = invoice.type === "deposit" ? "Deposit" : "Final Balance";
  const subject = `Invoice ${invoice.invoice_number} — ${booking.service_type} Booking ${booking.reference}`;

  const emailHtml = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#6b21a8;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Invoice from ${companyName}</h1>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
      <p style="color:#1e293b;">Hi ${customer.full_name},</p>
      <p style="color:#475569;line-height:1.6;">Please find your <strong>${typeLabel}</strong> invoice attached to this email.</p>
      <div style="border:2px solid #6b21a8;border-radius:10px;padding:16px;margin:20px 0;background:#faf5ff;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#64748b;padding:4px 0;">Invoice Number</td><td style="font-weight:bold;text-align:right;">${invoice.invoice_number}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0;">Amount Due</td><td style="font-weight:bold;text-align:right;color:#6b21a8;">${formatCurrency(invoice.total)}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0;">Due Date</td><td style="font-weight:bold;text-align:right;">${invoice.due_date ? formatDate(invoice.due_date) : "—"}</td></tr>
        </table>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
        <h3 style="margin:0 0 12px 0;color:#1e293b;font-size:15px;">Bank Transfer Details</h3>
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#64748b;padding:6px 0;">Account Name</td><td style="font-weight:600;text-align:right;">AMPLE LOGISTICS LIMITED</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Sort Code</td><td style="font-weight:600;text-align:right;">30-54-66</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Account Number</td><td style="font-weight:600;text-align:right;">12963462</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Reference</td><td style="font-weight:600;text-align:right;color:#6b21a8;">${invoice.invoice_number}</td></tr>
        </table>
        <p style="color:#64748b;font-size:12px;margin:12px 0 0 0;">⚠️ Please use your invoice number as the payment reference</p>
      </div>
      <p style="color:#64748b;font-size:13px;">Download your full invoice from the PDF attachment above.</p>
      ${invoice.type === "deposit" ? `<p style="color:#92400e;background:#fef3c7;border-radius:8px;padding:12px;font-size:13px;">This deposit secures your booking. The remaining balance will be invoiced after your move is complete.</p>` : ""}
      <p style="color:#475569;font-size:13px;">If you have any questions, please don't hesitate to contact us on ${companyPhone}.</p>
    </div>
  </body></html>`;

  // Send email (PDF attached if available)
  try {
    const attachments: { filename: string; content: string }[] = [];
    console.log("📧 Preparing invoice email. PDF URL:", pdfUrl);

    if (pdfUrl) {
      try {
        console.log("📥 Downloading PDF from storage...");
        const pdfBuffer = await downloadInvoicePDF(booking.id, invoiceId);
        console.log("✅ PDF downloaded, size:", pdfBuffer.length, "bytes");
        attachments.push({ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer.toString("base64") });
        console.log("✅ PDF attached to email");
      } catch (pdfDownloadErr) {
        console.error("❌ PDF download failed:", pdfDownloadErr);
        await logError({ message: `PDF download failed for email: ${pdfDownloadErr instanceof Error ? pdfDownloadErr.message : String(pdfDownloadErr)}`, metadata: { invoiceId } });
      }
    } else {
      console.warn("⚠️ No PDF URL found, sending email without attachment");
    }

    console.log("📤 Sending email to:", customer.email, "with", attachments.length, "attachment(s)");
    await resend.emails.send({
      from: resendFrom, to: customer.email, subject, html: emailHtml,
      ...(attachments.length ? { attachments } : {}),
    } as Parameters<typeof resend.emails.send>[0]);
    console.log("✅ Invoice email sent successfully");
  } catch (err) {
    console.error("❌ Invoice email failed:", err);
    await logError({ message: `Invoice email failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
  }

  // Send SMS
  try {
    if (twilioClient && customer.phone) {
      const msg = `Hi ${customer.full_name.split(" ")[0]}, your ${typeLabel} invoice for ${formatCurrency(invoice.total)} (${invoice.invoice_number}) has been sent to your email. Pay by bank transfer - details in email.`;
      await twilioClient.messages.create({ from: twilioFrom, to: normaliseUKPhone(customer.phone), body: normaliseSmsBody(msg) });
    }
  } catch (err) {
    await logError({ message: `Invoice SMS failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
  }

  // Update invoice status
  await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoiceId);

  // Advance the booking status when the invoice is actually sent:
  // deposit invoice → "Deposit Invoice Sent", full balance → "Full Invoice Sent".
  // (Confirmation only sets "Quote Confirmed"; sending the invoice is what moves
  // the pipeline on.) Don't regress a booking that's already further along.
  const nextStatus = invoice.type === "deposit" ? "deposit_invoice_sent"
    : invoice.type === "full_balance" ? "full_invoice_sent" : null;
  if (nextStatus && booking.status !== nextStatus) {
    await supabase.from("bookings").update({ status: nextStatus }).eq("id", booking.id);
    await supabase.from("status_history").insert({
      booking_id: booking.id,
      previous_status: booking.status ?? null,
      new_status: nextStatus,
      changed_by: "admin",
      reason: `${invoice.type === "deposit" ? "Deposit" : "Full balance"} invoice ${invoice.invoice_number} sent`,
    });
  }

  // Log activity
  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    action: `Invoice ${invoice.invoice_number} sent to customer`,
    metadata: { invoiceId, invoiceNumber: invoice.invoice_number, email: customer.email },
    performed_by: "admin",
  });

  // Insert automation_logs for deposit invoice reminder rule
  if (invoice.type === "deposit") {
    try {
      const { data: reminderRule } = await supabase.from("automation_rules").select("id").eq("trigger_event", "invoice_sent_unpaid").eq("is_active", true).maybeSingle();
      if (reminderRule) {
        await supabase.from("automation_logs").insert({
          rule_id: reminderRule.id,
          booking_id: booking.id,
          triggered_at: new Date().toISOString(),
          status: "pending",
        });
      }
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ success: true });
}
