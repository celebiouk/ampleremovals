/**
 * Approving a driver's on-site extra (lib/followups counterpart: this never
 * runs on a cron, only from an admin click) turns it into its own small
 * payable invoice and notifies the customer — email + SMS go out immediately,
 * WhatsApp is queued for the admin to send manually (see sendWhatsApp in
 * lib/twilio.ts — that's existing, unconditional behaviour, nothing extra to
 * wire up here).
 */
import { randomBytes } from "crypto";
import { generateInvoiceNumber, formatDate, formatCurrency } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
import { uploadInvoicePDF, getInvoiceSignedURL } from "@/lib/storage";
import { sendEmail } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { logError } from "@/lib/log-error";
import { SERVICE_LABELS, COMPANY_PHONE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";
import type { ServiceType, InvoicePDFData } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

export interface ExtraChargeResult { invoiceId: string; invoiceNumber: string; payLink: string }

export async function createAndSendExtraCharge(
  supabase: SupabaseAdmin,
  jobExtraId: string,
): Promise<ExtraChargeResult> {
  const { data: extra, error: extraErr } = await supabase
    .from("job_extras")
    .select("id, booking_id, description, amount")
    .eq("id", jobExtraId)
    .single();
  if (extraErr || !extra) throw new Error(`Extra not found: ${extraErr?.message}`);

  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .select("id, reference, service_type, customer_id, customers!inner(full_name, email, phone)")
    .eq("id", extra.booking_id)
    .single();
  if (bookingErr || !booking) throw new Error(`Booking not found: ${bookingErr?.message}`);

  const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as
    { full_name: string; email: string; phone: string } | null;

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  const companyName = settings?.company_name ?? "Ample Removals";
  const companyPhone = settings?.company_phone ?? COMPANY_PHONE;
  const companyEmail = settings?.company_email ?? "";
  const companyAddress = settings?.company_address ?? "";

  const amount = Number(extra.amount);
  const description = extra.description as string;

  let invoiceNumber = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateInvoiceNumber();
    const { data: exists } = await supabase.from("invoices").select("id").eq("invoice_number", candidate).maybeSingle();
    if (!exists) { invoiceNumber = candidate; break; }
  }
  if (!invoiceNumber) throw new Error("Failed to generate unique invoice number");

  let payCode = "";
  for (let i = 0; i < 10; i++) {
    const candidate = randomBytes(5).toString("hex");
    const { data: clash } = await supabase.from("invoices").select("id").eq("pay_code", candidate).maybeSingle();
    if (!clash) { payCode = candidate; break; }
  }

  const lineItems = [{ description, quantity: 1, unit_price: amount, total: amount }];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { data: invoice, error: insertErr } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      booking_id: booking.id,
      customer_id: booking.customer_id,
      type: "extra",
      status: "sent",
      line_items: lineItems,
      subtotal: amount,
      vat_rate: 0,
      vat_amount: 0,
      total: amount,
      due_date: dueDate.toISOString().slice(0, 10),
      pay_code: payCode || null,
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insertErr || !invoice) throw new Error(`Invoice insert failed: ${insertErr?.message}`);
  const invoiceId = invoice.id as string;

  await supabase.from("job_extras").update({ invoice_id: invoiceId }).eq("id", jobExtraId);

  const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;
  const payLink = `${SITE_URL}/pay/${payCode}`;

  // PDF generation is best-effort — a failure here shouldn't block the invoice
  // existing or the customer being told about the charge (same pattern as the
  // main invoice-generate route).
  try {
    const pdfData: InvoicePDFData = {
      invoiceNumber, invoiceDate: formatDate(new Date()), dueDate: formatDate(dueDate), status: "sent", type: "extra",
      companyName, companyAddress, companyPhone, companyEmail,
      customerName: customer?.full_name ?? "", customerEmail: customer?.email ?? "", customerPhone: customer?.phone ?? "",
      originAddress: "", bookingReference: booking.reference as string, serviceType: serviceLabel, moveDate: "",
      lineItems, subtotal: amount, vatRate: 0, vatAmount: 0, total: amount,
    };
    const pdfBuffer = await generateInvoicePDF(pdfData);
    await uploadInvoicePDF(booking.id as string, invoiceId, pdfBuffer);
    const pdfUrl = await getInvoiceSignedURL(booking.id as string, invoiceId);
    await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoiceId);
  } catch (pdfErr) {
    await logError({ message: `Extra-charge invoice PDF failed: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`, metadata: { invoiceId } });
  }

  if (customer?.email || customer?.phone) {
    const firstName = (customer?.full_name || "there").split(" ")[0];
    const amountStr = formatCurrency(amount);
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;">
      <div style="background:#6b21a8;padding:22px 28px;border-radius:12px 12px 0 0;">
        <p style="color:#fff;margin:0;font-size:19px;font-weight:bold;">An extra charge was added to your move</p>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">Hi ${firstName},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">Our crew flagged something on the day that wasn't in your original quote (ref ${booking.reference}): <strong>${description}</strong>, which comes to <strong>${amountStr}</strong>.</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">You can pay it securely here: <a href="${payLink}" style="color:#6b21a8;">${payLink}</a></p>
        <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">${companyName} · ${companyPhone}</p>
      </div>
    </body></html>`;
    try {
      if (customer?.email) await sendEmail({ to: customer.email, subject: `Extra charge on your move (${booking.reference}) — ${amountStr}`, html });
      if (customer?.phone) await sendSMS(customer.phone, `${companyName}: an extra charge was added to your move (${booking.reference}) - ${amountStr} for ${description}. Pay: ${payLink}`);
      if (customer?.phone) await sendWhatsApp(customer.phone, `Hi ${firstName}! Our crew flagged an extra on the day that wasn't in your original quote (ref ${booking.reference}): *${description}* - *${amountStr}*.\n\nPay securely here: ${payLink}\nQuestions: ${companyPhone}`, undefined, { bookingId: booking.id as string, title: "Extra charge added" });
    } catch (sendErr) {
      await logError({ message: `Extra-charge customer notify failed: ${sendErr instanceof Error ? sendErr.message : String(sendErr)}`, metadata: { invoiceId } });
    }
  }

  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    action: `Extra charge approved and invoiced: ${description} (${formatCurrency(amount)}) — ${invoiceNumber}`,
    metadata: { invoiceId, invoiceNumber, amount },
    performed_by: "admin",
  });

  return { invoiceId, invoiceNumber, payLink };
}
