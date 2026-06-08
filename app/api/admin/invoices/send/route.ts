import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { twilioClient, twilioFrom } from "@/lib/twilio";
import { normaliseUKPhone, formatDate, formatCurrency } from "@/lib/utils";
import { downloadInvoicePDF, getInvoiceSignedURL } from "@/lib/storage";
import { logError } from "@/lib/log-error";

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
    .select("*, bookings!inner(id, reference, service_type, customer_id, customers!inner(full_name, email, phone))")
    .eq("id", invoiceId)
    .single();

  if (!invoice || invoice.status === "cancelled") {
    return NextResponse.json({ success: false, error: "Invoice not found or cancelled" }, { status: 400 });
  }

  const booking = invoice.bookings as { id: string; reference: string; service_type: string; customer_id: string; customers: { full_name: string; email: string; phone: string } };
  const customer = booking.customers;

  // Get fresh signed URL
  let pdfUrl = "";
  try {
    pdfUrl = await getInvoiceSignedURL(booking.id, invoiceId);
  } catch { /* PDF may not exist yet */ }

  const typeLabel = invoice.type === "deposit" ? "Deposit" : "Final Balance";
  const subject = `Invoice ${invoice.invoice_number} — ${booking.service_type} Booking ${booking.reference}`;
  const settings = await supabase.from("settings").select("company_name, company_phone").eq("id", 1).single();
  const companyName = settings.data?.company_name ?? "Ample Removals";

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
          <tr><td style="color:#64748b;padding:6px 0;">Account Name</td><td style="font-weight:600;text-align:right;">Ample Removals</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Sort Code</td><td style="font-weight:600;text-align:right;">04-00-04</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Account Number</td><td style="font-weight:600;text-align:right;">11756714</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Reference</td><td style="font-weight:600;text-align:right;color:#6b21a8;">${invoice.invoice_number}</td></tr>
        </table>
        <p style="color:#64748b;font-size:12px;margin:12px 0 0 0;">⚠️ Please use your invoice number as the payment reference</p>
      </div>
      <p style="color:#64748b;font-size:13px;">Download your full invoice from the PDF attachment above.</p>
      ${invoice.type === "deposit" ? `<p style="color:#92400e;background:#fef3c7;border-radius:8px;padding:12px;font-size:13px;">This deposit secures your booking. The remaining balance will be invoiced after your move is complete.</p>` : ""}
      <p style="color:#475569;font-size:13px;">If you have any questions, please don't hesitate to contact us on ${settings.data?.company_phone ?? "07344 683477"}.</p>
    </div>
  </body></html>`;

  // Send email (PDF attached if available)
  try {
      const attachments: { filename: string; content: string }[] = [];
    if (pdfUrl) {
      try {
        const pdfBuffer = await downloadInvoicePDF(booking.id, invoiceId);
        attachments.push({ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer.toString("base64") });
      } catch { /* non-critical */ }
    }

    await resend.emails.send({
      from: resendFrom, to: customer.email, subject, html: emailHtml,
      ...(attachments.length ? { attachments } : {}),
    } as Parameters<typeof resend.emails.send>[0]);
  } catch (err) {
    await logError({ message: `Invoice email failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
  }

  // Send SMS
  try {
    if (twilioClient && customer.phone) {
      const msg = `Hi ${customer.full_name.split(" ")[0]}, your ${typeLabel} invoice for ${formatCurrency(invoice.total)} (${invoice.invoice_number}) has been sent to your email. Pay by bank transfer - details in email.`;
      await twilioClient.messages.create({ from: twilioFrom, to: normaliseUKPhone(customer.phone), body: msg.slice(0, 160) });
    }
  } catch (err) {
    await logError({ message: `Invoice SMS failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
  }

  // Update invoice status
  await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoiceId);

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
