/**
 * "Everything you supplied" booking-summary email. One reusable renderer used in
 * two places:
 *   1. Immediately after the customer submits (a full record of what they told us).
 *   2. Appended to the 3-days-before-move reminder (so they can re-check it in time).
 *
 * Deliberately plain and complete — it mirrors the details the crew will work
 * from, so the customer can spot anything wrong (especially the per-address
 * access details) and call us to correct it before move day.
 */
import { sendEmail } from "@/lib/resend";
import { formatCurrency } from "@/lib/utils";

export interface AccessInfo {
  floor?: string | null;
  hasLift?: boolean | null;
  parking?: boolean | null;
  notes?: string | null;
}

export interface AddressInfo {
  address: string;
  access: AccessInfo;
}

export interface BookingSummaryInput {
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  serviceLabel: string;
  dateText: string;
  from: AddressInfo;
  to?: AddressInfo | null;
  propertyType?: string | null;
  bedrooms?: string | null;
  inventory?: { label: string; quantity: number }[];
  extras?: string[];
  description?: string | null;
  quoteTotal?: number | null;
  /** Overrides for the two contexts (submit vs 3-day). */
  heading?: string;
  intro?: string;
}

const yesNo = (v?: boolean | null): string => (v == null ? "—" : v ? "Yes" : "No");

const floorLabel = (f?: string | null): string =>
  !f ? "—" : f === "ground" ? "Ground floor" : /^\d/.test(f) ? `Floor ${f}` : f;

const titleCase = (s?: string | null): string =>
  !s ? "—" : s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;width:150px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#1e293b;">${value}</td>
  </tr>`;
}

/** An address block with its access details underneath. */
function addressBlock(heading: string, info: AddressInfo): string {
  const a = info.access;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#f8fafc;padding:10px 18px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b21a8;">${heading}</p>
    </td></tr>
    <tr><td style="padding:4px 18px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row("Address", esc(info.address || "—"))}
        ${row("Floor", floorLabel(a.floor))}
        ${row("Lift", yesNo(a.hasLift))}
        ${row("Parking within 20m", yesNo(a.parking))}
        ${a.notes ? row("Access notes", esc(a.notes)) : ""}
      </table>
    </td></tr>
  </table>`;
}

export function bookingSummaryEmailHtml(input: BookingSummaryInput): string {
  const {
    reference, customerName, email, phone, serviceLabel, dateText,
    from, to, propertyType, bedrooms, inventory = [], extras = [], description,
    quoteTotal,
    heading = "Here's everything you gave us",
    intro = "Thanks for your booking request. So there are no surprises on the day, here is exactly what you told us. Please check it over — especially the access details for each address — and call us on 0333 577 2070 if anything needs changing.",
  } = input;

  const inventoryHtml = inventory.length
    ? `<ol style="margin:0;padding-left:20px;color:#1e293b;font-size:14px;line-height:1.8;">
        ${inventory.map((i) => `<li>${esc(i.label)}${i.quantity > 1 ? ` &times;${i.quantity}` : ""}</li>`).join("")}
       </ol>`
    : `<p style="margin:0;color:#64748b;font-size:14px;">No items listed.</p>`;

  const extrasHtml = extras.length
    ? `<ul style="margin:0;padding-left:20px;color:#1e293b;font-size:14px;line-height:1.8;">
        ${extras.map((e) => `<li>${esc(e)}</li>`).join("")}
       </ul>`
    : `<p style="margin:0;color:#64748b;font-size:14px;">None selected.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your booking details</title></head>
<body style="margin:0;padding:0;background:#f5f4f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="background:#6b21a8;border-radius:12px 12px 0 0;padding:30px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Ample Removals</h1>
          <p style="margin:8px 0 0;color:#d8b4fe;font-size:14px;">${esc(heading)}</p>
        </td></tr>

        <tr><td style="background:#ffffff;padding:36px 40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#1e1b4b;">Hi <strong>${esc(customerName)}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">${esc(intro)}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#faf5ff;border:2px solid #6b21a8;border-radius:10px;padding:16px 22px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#7c3aed;">Booking Reference</p>
              <p style="margin:0;font-size:26px;font-weight:800;color:#6b21a8;letter-spacing:1px;">${esc(reference)}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            ${row("Service", esc(serviceLabel))}
            ${row("Preferred date", esc(dateText))}
            ${propertyType || bedrooms ? row("Property", `${titleCase(propertyType)}${bedrooms ? ` · ${bedrooms === "studio" ? "Studio" : `${bedrooms} bedroom`}` : ""}`) : ""}
          </table>

          ${addressBlock("Moving from", from)}
          ${to ? addressBlock("Moving to", to) : ""}

          <p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#1e293b;">Items to move</p>
          ${inventoryHtml}

          <p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#1e293b;">Extra help</p>
          ${extrasHtml}

          ${description ? `<p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#1e293b;">About your move</p>
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${esc(description)}</p>` : ""}

          <p style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#1e293b;">Your contact details</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${row("Name", esc(customerName))}
            ${row("Email", esc(email))}
            ${row("Phone", esc(phone))}
          </table>

          ${quoteTotal != null ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
            <tr><td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 22px;">
              <p style="margin:0;font-size:14px;color:#166534;">Your quote</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#15803d;">${formatCurrency(quoteTotal)}</p>
            </td></tr>
          </table>` : ""}

          <p style="margin:28px 0 0;font-size:14px;color:#475569;line-height:1.6;">
            Something not right? Just call us on <a href="tel:03335772070" style="color:#6b21a8;font-weight:700;">0333 577 2070</a> and we'll update it.
          </p>
        </td></tr>

        <tr><td style="background:#6b21a8;border-radius:0 0 12px 12px;padding:22px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#ffffff;">Ample Removals</p>
          <p style="margin:0;font-size:13px;color:#d8b4fe;">Tel: 0333 577 2070</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Send the summary. Never throws — logs and swallows, like other notifications. */
export async function sendBookingSummaryEmail(input: BookingSummaryInput): Promise<void> {
  try {
    await sendEmail({
      to: input.email,
      subject: `Your booking details — ${input.reference}`,
      html: bookingSummaryEmailHtml(input),
    });
  } catch (e) {
    console.warn("booking summary email skipped:", e);
  }
}
