import { resend, resendFrom, resendAdminEmails } from "@/lib/resend";
import { twilioClient, twilioFrom, normaliseSmsBody } from "@/lib/twilio";
import { createAdminClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log-error";
import { formatDate, normaliseUKPhone } from "@/lib/utils";
import type { ServiceType, AddressOption } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────

const SERVICE_LABEL: Record<ServiceType, string> = {
  removals: "Home & Business Removals",
  man_and_van: "Man and Van",
  house_clearance: "House Clearance",
  house_cleaning: "House Cleaning",
  end_of_tenancy: "End of Tenancy Cleaning",
};

const SERVICE_LABEL_SHORT: Record<ServiceType, string> = {
  removals: "Removals",
  man_and_van: "Man & Van",
  house_clearance: "House Clearance",
  house_cleaning: "House Cleaning",
  end_of_tenancy: "End of Tenancy",
};

function formatAddress(addr?: AddressOption | null): string {
  if (!addr) return "N/A";
  return [addr.line_1, addr.line_2, addr.city, addr.postcode]
    .filter(Boolean)
    .join(", ");
}

async function logActivity(
  bookingId: string,
  customerId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  try {
    const supabase = createAdminClient();
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      customer_id: customerId,
      action,
      metadata,
      performed_by: "system",
    });
  } catch {
    // best-effort — never crash a notification over a log write
  }
}

// ── Email HTML builders ────────────────────────────────────────────────────

function customerEmailHtml(params: {
  customerName: string;
  reference: string;
  serviceLabel: string;
  dateText: string;
  originAddress: string;
}): string {
  const { customerName, reference, serviceLabel, dateText, originAddress } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Booking Request Received</title></head>
<body style="margin:0;padding:0;background:#f5f4f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#6b21a8;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Ample Removals</h1>
          <p style="margin:8px 0 0;color:#d8b4fe;font-size:14px;">Booking Request Received</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#1e1b4b;">Hi <strong>${customerName}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
            Thank you for choosing Ample Removals. We have received your <strong>${serviceLabel}</strong> request and our team will be in touch within <strong>2 hours</strong> to confirm the details.
          </p>

          <!-- Reference box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:#faf5ff;border:2px solid #6b21a8;border-radius:10px;padding:20px 24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#7c3aed;">Your Booking Reference</p>
              <p style="margin:0;font-size:28px;font-weight:800;color:#6b21a8;letter-spacing:1px;">${reference}</p>
            </td></tr>
          </table>

          <!-- Summary -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr><td style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Booking Summary</p>
            </td></tr>
            <tr><td style="padding:0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;width:100px;">Service</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#1e293b;">${serviceLabel}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;">Date</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#1e293b;">${dateText}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;font-size:14px;color:#64748b;">Address</td>
                  <td style="padding:12px 0;font-size:14px;font-weight:600;color:#1e293b;">${originAddress}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- What happens next -->
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e293b;">What happens next</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            ${["Our team reviews your request", "We call you within 2 hours to confirm", "Your booking is confirmed by email"].map((step, i) => `
            <tr><td style="padding:8px 0;font-size:14px;color:#475569;">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#6b21a8;border-radius:50%;color:#fff;font-size:12px;font-weight:700;margin-right:10px;">${i + 1}</span>
              ${step}
            </td></tr>`).join("")}
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <span style="display:inline-block;background:#16a34a;border-radius:10px;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;letter-spacing:0.01em;">We Will Be In Touch Soon</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#6b21a8;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#ffffff;">Ample Removals</p>
          <p style="margin:0 0 4px;font-size:13px;color:#d8b4fe;">Tel: 0333 577 2070</p>
          <p style="margin:12px 0 0;font-size:12px;color:#c4b5fd;line-height:1.5;">
            You are receiving this email because you submitted a booking request on our website.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminEmailHtml(params: {
  reference: string;
  serviceLabel: string;
  customerName: string;
  email: string;
  phone: string;
  dateText: string;
  originAddress: string;
  destinationAddress: string;
  additionalServices: string;
  description: string;
  bookingId: string;
  submittedAt: string;
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const {
    reference, serviceLabel, customerName, email, phone,
    dateText, originAddress, destinationAddress,
    additionalServices, description, bookingId, submittedAt,
  } = params;

  const rows = [
    ["Reference", reference],
    ["Service", serviceLabel],
    ["Date", dateText],
    ["Origin", originAddress],
    ["Destination", destinationAddress],
    ["Additional Services", additionalServices],
    ["Description", description],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Booking — ${reference}</title></head>
<body style="margin:0;padding:0;background:#f5f4f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#6b21a8;border-radius:12px 12px 0 0;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">🔔 New Booking Request</h1>
          <p style="margin:6px 0 0;color:#d8b4fe;font-size:13px;">Submitted ${submittedAt}</p>
        </td></tr>

        <!-- Alert -->
        <tr><td style="background:#fef9c3;border-left:4px solid #eab308;padding:16px 40px;">
          <p style="margin:0;font-size:14px;color:#713f12;font-weight:600;">
            A new <strong>${serviceLabel}</strong> booking has just been submitted.
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 40px;">

          <!-- Customer details -->
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e293b;">Customer Details</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;width:120px;">Name</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#1e293b;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;">Email</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#1e293b;">
                    <a href="mailto:${email}" style="color:#6b21a8;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;font-size:14px;color:#64748b;">Phone</td>
                  <td style="padding:12px 0;font-size:14px;font-weight:600;color:#1e293b;">
                    <a href="tel:${phone}" style="color:#6b21a8;">${phone}</a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Booking details -->
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e293b;">Booking Details</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows.map(([label, value], i) => `
                <tr>
                  <td style="padding:12px 0;${i < rows.length - 1 ? "border-bottom:1px solid #f1f5f9;" : ""}font-size:14px;color:#64748b;width:140px;vertical-align:top;">${label}</td>
                  <td style="padding:12px 0;${i < rows.length - 1 ? "border-bottom:1px solid #f1f5f9;" : ""}font-size:14px;font-weight:600;color:#1e293b;">${value}</td>
                </tr>`).join("")}
              </table>
            </td></tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${siteUrl}/admin/bookings/${bookingId}"
                 style="display:inline-block;background:#6b21a8;border-radius:10px;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                View in Admin Dashboard →
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#6b21a8;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#d8b4fe;">Ample Removals internal notification — do not reply to this email.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Exported notification functions ───────────────────────────────────────

export interface NotificationPayload {
  bookingId: string;
  customerId: string;
  reference: string;
  serviceType: ServiceType;
  customerName: string;
  email: string;
  phone: string;
  originAddress?: AddressOption | null;
  destinationAddress?: AddressOption | null;
  moveDate?: string | null;
  isFlexibleDate?: boolean;
  flexibleDateFrom?: string | null;
  flexibleDateTo?: string | null;
  description?: string | null;
  additionalServices?: {
    packingServices?: boolean;
    packingMaterials?: boolean;
    disassembleFurniture?: boolean;
    assembleFurniture?: boolean;
  } | null;
}

function buildDateText(payload: NotificationPayload): string {
  if (payload.isFlexibleDate && payload.flexibleDateFrom && payload.flexibleDateTo) {
    return `Flexible: ${formatDate(payload.flexibleDateFrom)} – ${formatDate(payload.flexibleDateTo)}`;
  }
  if (payload.moveDate) return formatDate(payload.moveDate);
  return "To be confirmed";
}

function buildAdditionalServicesText(
  svc?: NotificationPayload["additionalServices"]
): string {
  if (!svc) return "None";
  const selected = [
    svc.packingServices && "Packing Services",
    svc.packingMaterials && "Packing Materials",
    svc.disassembleFurniture && "Disassemble Furniture",
    svc.assembleFurniture && "Assemble Furniture",
  ].filter(Boolean) as string[];
  return selected.length ? selected.join(", ") : "None";
}

/**
 * Sends a branded confirmation email to the customer.
 * Failures are logged to server_logs but never throw.
 */
export async function sendCustomerConfirmationEmail(
  payload: NotificationPayload
): Promise<void> {
  try {
    const serviceLabel = SERVICE_LABEL[payload.serviceType];
    const dateText = buildDateText(payload);
    const originAddress = formatAddress(payload.originAddress);

    const { error } = await resend.emails.send({
      from: resendFrom,
      to: payload.email,
      subject: `We've received your booking request — Ref: ${payload.reference}`,
      html: customerEmailHtml({
        customerName: payload.customerName,
        reference: payload.reference,
        serviceLabel,
        dateText,
        originAddress,
      }),
    });

    if (error) throw new Error(error.message);

    await logActivity(payload.bookingId, payload.customerId, "Customer confirmation email sent", {
      email: payload.email,
      reference: payload.reference,
    });
  } catch (err) {
    await logError({
      message: `sendCustomerConfirmationEmail failed: ${err instanceof Error ? err.message : String(err)}`,
      metadata: { reference: payload.reference, email: payload.email },
    });
  }
}

/**
 * Sends a new-booking notification email to the admin inbox.
 * Failures are logged to server_logs but never throw.
 */
export async function sendAdminNewBookingEmail(
  payload: NotificationPayload
): Promise<void> {
  try {
    const serviceLabel = SERVICE_LABEL[payload.serviceType];
    const dateText = buildDateText(payload);
    const submittedAt = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const { error } = await resend.emails.send({
      from: resendFrom,
      to: resendAdminEmails,
      subject: `🔔 New Booking — ${SERVICE_LABEL_SHORT[payload.serviceType]} — Ref: ${payload.reference}`,
      html: adminEmailHtml({
        reference: payload.reference,
        serviceLabel,
        customerName: payload.customerName,
        email: payload.email,
        phone: payload.phone,
        dateText,
        originAddress: formatAddress(payload.originAddress),
        destinationAddress: formatAddress(payload.destinationAddress),
        additionalServices: buildAdditionalServicesText(payload.additionalServices),
        description: payload.description ?? "None provided",
        bookingId: payload.bookingId,
        submittedAt,
      }),
    });

    if (error) throw new Error(error.message);

    await logActivity(payload.bookingId, payload.customerId, "Admin notification email sent", {
      reference: payload.reference,
      adminEmails: resendAdminEmails,
    });
  } catch (err) {
    await logError({
      message: `sendAdminNewBookingEmail failed: ${err instanceof Error ? err.message : String(err)}`,
      metadata: { reference: payload.reference },
    });
  }
}

/**
 * Sends an SMS confirmation to the customer via Twilio.
 * Failures are logged to server_logs but never throw.
 * Silently skips if Twilio credentials are not configured.
 */
export async function sendCustomerConfirmationSMS(
  payload: NotificationPayload
): Promise<void> {
  if (!twilioClient) {
    // Twilio not configured — log as info and skip
    await logError({
      message: "sendCustomerConfirmationSMS skipped: Twilio credentials not configured",
      metadata: { reference: payload.reference },
      level: "info",
    });
    return;
  }

  try {
    const serviceLabel = SERVICE_LABEL_SHORT[payload.serviceType];
    const to = normaliseUKPhone(payload.phone);

    // Keep under 160 chars
    const body =
      `Hi ${payload.customerName}, we've received your ${serviceLabel} request (Ref: ${payload.reference}). ` +
      `Our team will call you within 2 hours to confirm. – Ample Removals`;

    await twilioClient.messages.create({
      from: twilioFrom,
      to,
      body: normaliseSmsBody(body),
    });

    await logActivity(payload.bookingId, payload.customerId, "Customer SMS confirmation sent", {
      phone: payload.phone,
      reference: payload.reference,
    });
  } catch (err) {
    await logError({
      message: `sendCustomerConfirmationSMS failed: ${err instanceof Error ? err.message : String(err)}`,
      metadata: { reference: payload.reference, phone: payload.phone },
    });
  }
}
