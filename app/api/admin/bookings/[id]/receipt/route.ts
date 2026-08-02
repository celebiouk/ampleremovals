import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { resend, resendFrom } from "@/lib/resend";
import { formatDate, formatCurrency, generateReceiptNumber } from "@/lib/utils";
import { logError } from "@/lib/log-error";
import { generatePaymentReceiptPDF } from "@/lib/pdf/generate-payment-receipt";
import { SERVICE_LABELS } from "@/lib/constants";
import type { PaymentReceiptData } from "@/lib/pdf/PaymentReceiptTemplate";
import type { ServiceType } from "@/types";

export const runtime = "nodejs";

const schema = z.object({
  amount: z.number().positive("Enter the amount paid."),
  paymentMethod: z.string().trim().min(1).max(40).optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
  sendEmail: z.boolean().optional(),
});

/**
 * POST /api/admin/bookings/[id]/receipt
 * Generates a payment receipt PDF for a booking (admin enters the amount paid).
 * Returns the PDF as base64 for immediate download, and — if `sendEmail` — also
 * emails it to the customer. Records the receipt in the activity log.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid details." }, { status: 400 });
  }
  const { amount, paymentMethod, paymentDate, description, notes, sendEmail } = parsed.data;

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, reference, service_type, move_date, is_flexible_date, flexible_date_from, flexible_date_to, customer:customers!inner(full_name, email, phone), origin_addr:addresses!origin_address_id(line_1, line_2, city, postcode)"
    )
    .eq("id", params.id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
  }

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const originAddr = (Array.isArray(booking.origin_addr) ? booking.origin_addr[0] : booking.origin_addr) as
    | { line_1: string; line_2?: string | null; city?: string | null; postcode: string }
    | null;
  const customerAddress = originAddr
    ? [originAddr.line_1, originAddr.line_2, originAddr.city, originAddr.postcode].filter(Boolean).join(", ")
    : "";
  const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? (booking.service_type as string);
  const moveDate = booking.is_flexible_date
    ? `Flexible: ${formatDate(booking.flexible_date_from ?? "")} – ${formatDate(booking.flexible_date_to ?? "")}`
    : booking.move_date ? formatDate(booking.move_date as string) : "TBC";

  // Company details from settings (fall back to sensible defaults).
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const companyName = settings?.company_name ?? "Ample Removals";
  const companyAddress = settings?.company_address ?? "";
  const companyPhone = settings?.company_phone ?? "0333 577 2070";
  const companyEmail = settings?.company_email ?? "hello@ampleremovals.com";

  const receiptNumber = generateReceiptNumber();
  const payDateStr = paymentDate ?? new Date().toISOString().slice(0, 10);

  const pdfData: PaymentReceiptData = {
    receiptNumber,
    receiptDate: formatDate(new Date().toISOString()),
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    customerName: customer?.full_name ?? "Customer",
    customerEmail: customer?.email ?? "",
    customerPhone: customer?.phone ?? "",
    customerAddress,
    bookingReference: booking.reference as string,
    serviceType: serviceLabel,
    moveDate,
    description: description || `${serviceLabel} — Booking ${booking.reference}`,
    amountPaid: amount,
    paymentMethod: paymentMethod || "Bank Transfer",
    paymentDate: formatDate(payDateStr),
    notes: notes || undefined,
  };

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePaymentReceiptPDF(pdfData);
  } catch (e) {
    await logError({ message: `Receipt PDF generation failed: ${e instanceof Error ? e.message : String(e)}`, metadata: { bookingId: params.id } });
    return NextResponse.json({ success: false, error: "Couldn't generate the receipt PDF." }, { status: 500 });
  }

  const filename = `${receiptNumber}.pdf`;

  // Optionally email it to the customer (best-effort — never fails the receipt).
  let emailed = false;
  if (sendEmail && customer?.email) {
    try {
      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: `Payment receipt ${receiptNumber} — ${companyName}`,
        html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#16a34a;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Payment received — thank you</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
            <p style="color:#1e293b;">Hi ${(customer.full_name ?? "there").split(" ")[0]},</p>
            <p style="color:#475569;line-height:1.6;">Thanks for your payment. Your receipt is attached for your records.</p>
            <div style="border:2px solid #16a34a;border-radius:10px;padding:16px;margin:20px 0;background:#f0fdf4;">
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#64748b;padding:4px 0;">Receipt Number</td><td style="font-weight:bold;text-align:right;">${receiptNumber}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0;">Amount Paid</td><td style="font-weight:bold;text-align:right;color:#166534;">${formatCurrency(amount)}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0;">Booking</td><td style="font-weight:bold;text-align:right;">${booking.reference}</td></tr>
              </table>
            </div>
            <p style="color:#475569;font-size:13px;">Any questions? Call us on ${companyPhone}.</p>
          </div>
        </body></html>`,
        attachments: [{ filename, content: pdfBuffer.toString("base64") }],
      } as Parameters<typeof resend.emails.send>[0]);
      emailed = true;
    } catch (e) {
      await logError({ message: `Receipt email failed: ${e instanceof Error ? e.message : String(e)}`, metadata: { bookingId: params.id, receiptNumber } });
    }
  }

  // Paper trail — record that a receipt was issued.
  await supabase.from("activity_log").insert({
    booking_id: params.id,
    action: `Receipt ${receiptNumber} generated for ${formatCurrency(amount)}${emailed ? " (emailed to customer)" : ""}`,
    metadata: { receiptNumber, amount, paymentMethod: pdfData.paymentMethod, paymentDate: payDateStr, emailed },
    performed_by: "admin",
  });

  return NextResponse.json({
    success: true,
    receiptNumber,
    filename,
    emailed,
    pdfBase64: pdfBuffer.toString("base64"),
  });
}
