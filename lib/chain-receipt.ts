/**
 * Pickup / delivery receipt — branded PDF emailed to the customer when a leg's
 * chain of custody is confirmed. Best-effort: never throws, so it can't block
 * the driver's confirmation.
 */
import { generateReceiptPDF } from "@/lib/pdf/generate-receipt";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";
import { formatDateTime } from "@/lib/utils";
import { SERVICE_LABELS } from "@/lib/constants";
import type { ServiceType } from "@/types";

const PHOTO_BUCKET = "driver-documents";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function sendChainReceipt(supabase: any, bookingId: string, leg: "pickup" | "delivery"): Promise<void> {
  try {
    const addrFk = leg === "pickup" ? "origin_address_id" : "destination_address_id";
    const { data: b } = await supabase
      .from("bookings")
      .select(`
        reference, service_type,
        ${leg}_contact_name, ${leg}_comments, ${leg}_confirmed_at,
        customer:customers(full_name, email, phone),
        addr:addresses!${addrFk}(line_1, city, postcode)
      `)
      .eq("id", bookingId)
      .single();
    if (!b) return;

    const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    if (!customer) return;
    const addr = Array.isArray(b.addr) ? b.addr[0] : b.addr;

    // Count photos in storage for this leg (best-effort).
    let photoCount = 0;
    try {
      const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(`jobs/${bookingId}/${leg}/photos`);
      photoCount = (files ?? []).filter((f: any) => f.id || f.name).length;
    } catch { /* none */ }

    const { data: settings } = await supabase.from("settings").select("company_name, company_phone").eq("id", 1).single();
    const legLabel = leg === "pickup" ? "Pickup" : "Delivery";
    const serviceLabel = SERVICE_LABELS[b.service_type as ServiceType] ?? b.service_type;
    const confirmedAt = b[`${leg}_confirmed_at`] ? formatDateTime(b[`${leg}_confirmed_at`]) : new Date().toLocaleString("en-GB");

    const pdf = await generateReceiptPDF({
      leg: legLabel,
      companyName: settings?.company_name ?? "Ample Removals",
      reference: b.reference,
      serviceType: serviceLabel,
      customerName: customer.full_name ?? "Customer",
      contactName: b[`${leg}_contact_name`] ?? "",
      time: confirmedAt,
      address: addr ? [addr.line_1, addr.city, addr.postcode].filter(Boolean).join(", ") : "",
      comments: b[`${leg}_comments`] ?? null,
      photoCount,
      companyPhone: settings?.company_phone ?? "0333 577 2070",
    });

    const first = (customer.full_name ?? "there").split(" ")[0];
    const body = leg === "pickup"
      ? `Your items have been <strong>collected and released for transport</strong>. Your pickup receipt is attached.`
      : `Your items have been <strong>delivered and received</strong>. Your delivery receipt is attached — thank you for choosing us!`;

    if (customer.phone) {
      const smsText = leg === "pickup"
        ? `Ample Removals: Pickup confirmed for ${b.reference} ✅ Your items are with us. Receipt emailed to you.`
        : `Ample Removals: Delivery confirmed for ${b.reference} ✅ Thank you for choosing us! Receipt emailed to you.`;
      await sendSMS(customer.phone, smsText).catch(() => {});
    }

    if (customer.email) await resend.emails.send({
      from: resendFrom,
      to: customer.email,
      subject: `Your Ample Removals ${legLabel.toLowerCase()} receipt — ${b.reference}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#6b21a8;padding:22px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">${legLabel} Confirmed ✅</h1>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:26px;">
          <p style="color:#1e293b;">Hi ${first},</p>
          <p style="color:#475569;line-height:1.6;">${body}</p>
          <p style="color:#64748b;font-size:13px;">Job reference: <strong>${b.reference}</strong></p>
        </div>
      </div>`,
      attachments: [{ filename: `${legLabel}-Receipt-${b.reference}.pdf`, content: pdf.toString("base64") }],
    } as Parameters<typeof resend.emails.send>[0]);

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `${legLabel} receipt sent to customer`,
      metadata: { leg }, performed_by: "system",
    });
  } catch (e) {
    console.error(`sendChainReceipt(${leg}) failed:`, e);
  }
}
