import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { twilioClient, twilioFrom, normaliseSmsBody } from "@/lib/twilio";
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
    .select("*, bookings!inner(id, reference, service_type, customers!inner(full_name, email, phone))")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });

  const booking = invoice.bookings as { id: string; reference: string; service_type: string; customers: { full_name: string; email: string; phone: string } };
  const customer = booking.customers;
  const typeLabel = invoice.type === "deposit" ? "Deposit" : "Final Balance";

  // Ensure a pay-code so "Pay Now" points at the live pay page (card + bank).
  let payCode = invoice.pay_code as string | null;
  if (!payCode) {
    for (let i = 0; i < 10; i++) {
      const candidate = randomBytes(5).toString("hex");
      const { data: clash } = await supabase.from("invoices").select("id").eq("pay_code", candidate).maybeSingle();
      if (!clash) { payCode = candidate; break; }
    }
    if (payCode) await supabase.from("invoices").update({ pay_code: payCode }).eq("id", invoiceId);
  }
  const payLink = payCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com"}/pay/${payCode}`
    : (invoice.stripe_payment_link ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com"}`);

  let pdfAttachment: { filename: string; content: string } | undefined;
  try {
    await getInvoiceSignedURL(booking.id, invoiceId);
    const pdfBuffer = await downloadInvoicePDF(booking.id, invoiceId);
    pdfAttachment = { filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer.toString("base64") };
  } catch { /* no PDF */ }

  const subject = `Reminder: Invoice ${invoice.invoice_number} — ${formatCurrency(invoice.total)} due ${invoice.due_date ? formatDate(invoice.due_date) : ""}`;

  try {
    await resend.emails.send({
      from: resendFrom, to: customer.email, subject,
      html: `<p>Hi ${customer.full_name},</p><p>This is a reminder that your ${typeLabel} invoice (${invoice.invoice_number}) for <strong>${formatCurrency(invoice.total)}</strong> is awaiting payment.</p><p><a href="${payLink}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Pay Now (card or bank) →</a></p>`,
      ...(pdfAttachment ? { attachments: [pdfAttachment] } : {}),
    } as Parameters<typeof resend.emails.send>[0]);
  } catch (err) {
    await logError({ message: `Invoice resend email failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
  }

  try {
    if (twilioClient && customer.phone) {
      const msg = normaliseSmsBody(`Reminder: Invoice ${invoice.invoice_number} for ${formatCurrency(invoice.total)} is due. Pay online (card or bank): ${payLink}`);
      await twilioClient.messages.create({ from: twilioFrom, to: normaliseUKPhone(customer.phone), body: msg });
    }
  } catch (err) {
    await logError({ message: `Invoice resend SMS failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { invoiceId } });
  }

  await supabase.from("activity_log").insert({
    booking_id: booking.id,
    action: `Invoice ${invoice.invoice_number} resent to customer`,
    metadata: { invoiceId, invoiceNumber: invoice.invoice_number },
    performed_by: "admin",
  });

  return NextResponse.json({ success: true });
}
