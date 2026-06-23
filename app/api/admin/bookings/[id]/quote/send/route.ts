import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { generateQuotePDF } from "@/lib/pdf/generate-quote-pdf";
import { uploadQuotePDF, getQuoteSignedURL } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import { COMPANY_PHONE } from "@/lib/constants";
import { generateQuoteConfirmToken } from "@/lib/tokens";
import type { QuotePDFData, QuoteLineItem } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.co.uk";

/**
 * POST /api/admin/bookings/[id]/quote/send
 * Generate quote PDF, upload to storage, and send via Email (with PDF), SMS, and WhatsApp.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("📧 Quote send route called");
    const { id: bookingId } = await context.params;
    console.log("  bookingId:", bookingId);
    const supabase = await createClient();

    // Fetch booking with all quote data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        status,
        quote_line_items,
        quote_subtotal,
        quote_vat_rate,
        quote_vat_amount,
        quote_total,
        quote_valid_until,
        quote_notes,
        quote_deposit_required,
        customer:customers(full_name, email, phone),
        origin_address:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination_address:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.quote_total || !booking.quote_line_items || !Array.isArray(booking.quote_line_items)) {
      return NextResponse.json(
        { success: false, error: "Quote data not found. Please save a quote first." },
        { status: 400 }
      );
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    const originAddress = Array.isArray(booking.origin_address) ? booking.origin_address[0] : booking.origin_address;
    const destinationAddress = Array.isArray(booking.destination_address) ? booking.destination_address[0] : booking.destination_address;

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Format addresses
    const formatAddress = (addr: typeof originAddress) => {
      if (!addr) return "N/A";
      return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
    };

    // Prepare PDF data
    const pdfData: QuotePDFData = {
      quote_number: `QUOTE-${booking.reference}`,
      customer_name: customer.full_name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      service_type: booking.service_type.replace(/_/g, " ").toUpperCase(),
      origin_address: formatAddress(originAddress),
      destination_address: destinationAddress ? formatAddress(destinationAddress) : undefined,
      date: new Date().toLocaleDateString("en-GB"),
      valid_until: booking.quote_valid_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
      line_items: booking.quote_line_items as QuoteLineItem[],
      subtotal: Number(booking.quote_subtotal),
      vat_rate: Number(booking.quote_vat_rate),
      vat_amount: Number(booking.quote_vat_amount),
      total: Number(booking.quote_total),
      notes: booking.quote_notes || undefined,
    };

    // Generate PDF
    console.log("📄 Generating quote PDF...");
    console.log("  PDF data:", JSON.stringify(pdfData, null, 2));
    const pdfBuffer = await generateQuotePDF(pdfData);
    console.log("✅ PDF generated, size:", pdfBuffer.length);

    // Upload to storage
    await uploadQuotePDF(bookingId, booking.reference, pdfBuffer);
    const pdfUrl = await getQuoteSignedURL(bookingId, booking.reference);

    // Update booking with PDF URL + sent timestamp, move it into the
    // "Quote Sent to Customer" status, and (re)start the reminder ladder from
    // step 0. Clearing quote_confirmed_at means a re-send re-opens the chase.
    const sentAt = new Date().toISOString();
    await supabase
      .from("bookings")
      .update({
        quote_pdf_url: pdfUrl,
        quote_sent_at: sentAt,
        status: "quote_sent",
        quote_confirmed_at: null,
        quote_followup_stage: 0,
        quote_last_followup_at: sentAt, // step-1 gap (2h) is measured from here
      })
      .eq("id", bookingId);

    // Record the status transition (reminders run only while status = quote_sent).
    await supabase.from("status_history").insert({
      booking_id: bookingId,
      previous_status: booking.status ?? null,
      new_status: "quote_sent",
      changed_by: "admin",
      reason: "Quote sent to customer",
    });

    // Generate confirmation token (if feature is enabled)
    const confirmToken = generateQuoteConfirmToken(bookingId);
    const confirmUrl = confirmToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/confirm-quote/${bookingId}/${confirmToken}`
      : null;

    // Check if deposit is required (defaults to true if not set)
    const depositRequired = booking.quote_deposit_required !== false;

    // Prepare communication content
    const emailSubject = `Your Quote from Ample Removals — ${booking.reference}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b21a8;">Your Quote is Ready!</h2>
        <p>Dear ${customer.full_name},</p>
        <p>Thank you for your inquiry. We're pleased to provide you with a detailed quote for your <strong>${booking.service_type.replace(/_/g, " ")}</strong> service.</p>

        <div style="background: #f5f3ff; border-left: 4px solid #6b21a8; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px;"><strong>Quote Total:</strong> ${formatCurrency(Number(booking.quote_total))}</p>
          <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Valid Until:</strong> ${pdfData.valid_until}</p>
        </div>

        <p><strong>Quote Summary:</strong></p>
        <ul>
          ${(booking.quote_line_items as QuoteLineItem[]).map((item) => `<li>${item.description} — ${formatCurrency(item.total)}</li>`).join("")}
        </ul>

        <p>Please find the complete quote attached as a PDF.</p>

        ${confirmUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl}" style="display: inline-block; padding: 14px 28px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ✓ Confirm This Quote
          </a>
          <p style="margin-top: 12px; font-size: 13px; color: #64748b;">Click the button above to confirm your booking instantly</p>
        </div>

        <p><strong>What happens next?</strong></p>
        <ol>
          <li>Click the confirmation button above</li>
          ${depositRequired
            ? `<li>We'll send you a deposit invoice to secure your booking</li>
              <li>Once the deposit is paid, your booking is confirmed!</li>`
            : `<li>Your booking will be confirmed!</li>
              <li>Full payment will be due on completion of the service</li>`
          }
        </ol>
        ` : `
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Review the attached quote carefully</li>
          <li>Reply to this email or call us to confirm</li>
          ${depositRequired
            ? `<li>We'll send you a deposit invoice to secure your booking</li>`
            : `<li>Full payment will be due on completion of the service</li>`
          }
        </ol>
        `}

        <p>If you have any questions, please don't hesitate to reach out.</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 14px; color: #64748b;">
          Best regards,<br><br>
          Daniel<br>
          Ample Removal Team<br>
          03335772070
        </p>
      </div>
    `;

    const smsBody = `Ample Removals: Your ${booking.service_type.replace(/_/g, " ")} quote ${formatCurrency(Number(booking.quote_total))} is ready - full details & confirm link emailed to you. Questions? Call ${COMPANY_PHONE}. Ref ${booking.reference}`;

    const whatsappBody = `Hi ${customer.full_name}! Your Ample Removals quote is ready:\n\n📋 Service: ${booking.service_type.replace(/_/g, " ")}\n💷 Total: ${formatCurrency(Number(booking.quote_total))}\n📅 Valid until: ${pdfData.valid_until}\n\nFull PDF sent to your email. Reply here or call us to confirm!\n\nRef: ${booking.reference}`;

    // Send Email with PDF attachment
    let emailSuccess = false;
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customer.email,
        subject: emailSubject,
        html: emailBody,
        attachments: [{
          filename: `Quote-${booking.reference}.pdf`,
          content: pdfBuffer,
        }],
      });
      emailSuccess = true;
    } catch (emailErr) {
      await supabase.from("server_logs").insert({
        level: "error",
        message: "Failed to send quote email",
        metadata: { booking_id: bookingId, error: String(emailErr) },
      });
    }

    // Send SMS
    let smsSuccess = false;
    const smsResult = await sendSMS(customer.phone, smsBody);
    if (smsResult.success) {
      smsSuccess = true;
    } else {
      await supabase.from("server_logs").insert({
        level: "error",
        message: "Failed to send quote SMS",
        metadata: { booking_id: bookingId, error: smsResult.error },
      });
    }

    // Send WhatsApp
    let whatsappSuccess = false;
    const whatsappResult = await sendWhatsApp(customer.phone, whatsappBody, {
      name: "quote_ready",
      variables: {
        "1": customer.full_name.split(" ")[0],
        "2": booking.service_type.replace(/_/g, " "),
        "3": formatCurrency(Number(booking.quote_total)),
        "4": booking.reference,
      },
    });
    if (whatsappResult.success) {
      whatsappSuccess = true;
    } else {
      await supabase.from("server_logs").insert({
        level: "warn",
        message: "Failed to send quote WhatsApp",
        metadata: { booking_id: bookingId, error: whatsappResult.error },
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Quote sent to customer",
      metadata: {
        total: booking.quote_total,
        email_sent: emailSuccess,
        sms_sent: smsSuccess,
        whatsapp_sent: whatsappSuccess,
      },
      performed_by: "admin",
    });

    return NextResponse.json({
      success: true,
      pdf_url: pdfUrl,
      channels: {
        email: emailSuccess,
        sms: smsSuccess,
        whatsapp: whatsappSuccess,
      },
    });
  } catch (err) {
    console.error("❌ Quote send error:", err);
    console.error("Stack:", err instanceof Error ? err.stack : "No stack");

    const supabase = await createClient();
    await supabase.from("server_logs").insert({
      level: "error",
      message: "Quote send exception",
      metadata: {
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined,
        message: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
        details: process.env.NODE_ENV === "development" ? String(err) : undefined,
      },
      { status: 500 }
    );
  }
}
