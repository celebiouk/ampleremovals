import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { generateInvoiceNumber, formatDate } from "@/lib/utils";
import { createStripePaymentLink } from "@/lib/stripe-invoice";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
import { uploadInvoicePDF, getInvoiceSignedURL } from "@/lib/storage";
import { logError } from "@/lib/log-error";
import { SERVICE_LABELS } from "@/lib/constants";
import type { ServiceType, InvoicePDFData } from "@/types";

export const runtime = "nodejs";

const schema = z.object({
  bookingId: z.string().uuid(),
  type: z.enum(["deposit", "full_balance"]),
  lineItems: z.array(z.object({
    description: z.string().min(2),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0.01),
  })).min(1),
  vatRate: z.number().refine(v => v === 0 || v === 20),
  dueDate: z.string().min(8),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });

  const { bookingId, type, lineItems, vatRate, dueDate, notes } = parsed.data;
  const supabase = createAdminClient();

  try {
    // Fetch booking + customer + addresses
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, reference, service_type, move_date, is_flexible_date, flexible_date_from, flexible_date_to, customer_id, customers!inner(full_name, email, phone), origin_addr:addresses!origin_address_id(line_1, line_2, city, postcode)")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 400 });

    // Check for existing active invoice of same type
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("type", type)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existing) return NextResponse.json({
      success: false,
      error: `A ${type} invoice already exists for this booking. Cancel it before generating a new one.`,
    }, { status: 400 });

    // Fetch settings
    const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
    const companyName = settings?.company_name ?? "Ample Removals";
    const companyPhone = settings?.company_phone ?? "07344 683477";
    const companyEmail = settings?.company_email ?? "";
    const companyAddress = settings?.company_address ?? "";

    // Calculate totals
    const subtotal = Math.round(lineItems.reduce((a, i) => a + i.quantity * i.unitPrice, 0) * 100) / 100;
    const vatAmount = vatRate > 0 ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    // Generate unique invoice number
    let invoiceNumber = "";
    for (let i = 0; i < 10; i++) {
      const candidate = generateInvoiceNumber();
      const { data: exists } = await supabase.from("invoices").select("id").eq("invoice_number", candidate).maybeSingle();
      if (!exists) { invoiceNumber = candidate; break; }
    }
    if (!invoiceNumber) throw new Error("Failed to generate unique invoice number");

    // Build formatted line items
    const formattedLineItems = lineItems.map(i => ({
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total: Math.round(i.quantity * i.unitPrice * 100) / 100,
    }));

    const customer = (Array.isArray(booking.customers) ? booking.customers[0] : booking.customers) as { full_name: string; email: string; phone: string } | null;
    const originAddr = (Array.isArray(booking.origin_addr) ? booking.origin_addr[0] : booking.origin_addr) as { line_1: string; line_2?: string | null; city?: string | null; postcode: string } | null;
    const originAddress = originAddr ? [originAddr.line_1, originAddr.line_2, originAddr.city, originAddr.postcode].filter(Boolean).join(", ") : "";
    const serviceLabel = SERVICE_LABELS[booking.service_type as ServiceType] ?? booking.service_type;
    const moveDate = booking.is_flexible_date
      ? `Flexible: ${formatDate(booking.flexible_date_from ?? "")} – ${formatDate(booking.flexible_date_to ?? "")}`
      : booking.move_date ? formatDate(booking.move_date) : "TBC";

    // Create Stripe Payment Link
    const { paymentLink, paymentLinkId, priceId, productId } = await createStripePaymentLink({
      invoiceId: "pending", // placeholder until we have the DB id
      invoiceNumber,
      amount: Math.round(total * 100),
      customerName: customer?.full_name ?? "",
      customerEmail: customer?.email ?? "",
      description: `${type === "deposit" ? "Deposit" : "Final Balance"} — ${serviceLabel} (Booking ${booking.reference})`,
      bookingReference: booking.reference,
      metadata: { bookingId },
    });

    // Insert invoice record
    const { data: invoice, error: insertErr } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        booking_id: bookingId,
        customer_id: booking.customer_id,
        type,
        status: "draft",
        line_items: formattedLineItems,
        subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total,
        due_date: dueDate,
        stripe_payment_link: paymentLink,
        stripe_price_id: priceId,
        stripe_product_id: productId,
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (insertErr || !invoice) throw new Error(`Invoice insert failed: ${insertErr?.message}`);
    const invoiceId = invoice.id as string;

    // Generate PDF
    const pdfData: InvoicePDFData = {
      invoiceNumber,
      invoiceDate: formatDate(new Date()),
      dueDate: formatDate(dueDate),
      status: "draft",
      type,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      customerName: customer?.full_name ?? "",
      customerEmail: customer?.email ?? "",
      customerPhone: customer?.phone ?? "",
      originAddress,
      bookingReference: booking.reference,
      serviceType: serviceLabel,
      moveDate,
      lineItems: formattedLineItems,
      subtotal,
      vatRate,
      vatAmount,
      total,
      stripePaymentLink: paymentLink,
      notes,
    };

    let pdfUrl = "";
    try {
      const pdfBuffer = await generateInvoicePDF(pdfData);
      await uploadInvoicePDF(bookingId, invoiceId, pdfBuffer);
      pdfUrl = await getInvoiceSignedURL(bookingId, invoiceId);
      await supabase.from("invoices").update({ pdf_url: pdfUrl }).eq("id", invoiceId);
    } catch (pdfErr) {
      // PDF failure doesn't fail the invoice — log and continue
      await logError({ message: `PDF generation failed for invoice ${invoiceId}: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`, metadata: { invoiceId } });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `${type === "deposit" ? "Deposit" : "Full balance"} invoice generated: ${invoiceNumber}`,
      metadata: { invoiceId, invoiceNumber, total, type },
      performed_by: "admin",
    });

    return NextResponse.json({ success: true, invoiceId, invoiceNumber, total, stripePaymentLink: paymentLink, pdfUrl });
  } catch (err) {
    await logError({ message: `Invoice generate failed: ${err instanceof Error ? err.message : String(err)}`, metadata: { bookingId } });
    return NextResponse.json({ success: false, error: "Failed to generate invoice" }, { status: 500 });
  }
}
