import { sendEmail } from "@/lib/resend";
import { logError } from "@/lib/log-error";
import { LOGISTICS } from "@/lib/logistics";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";

/**
 * "From" address for every Ample Logistics notification. Requires
 * amplelogistics.co.uk to be added and verified as a sending domain in
 * Resend (Settings → Domains) — SPF/DKIM/DMARC records set at the
 * registrar. Until that's done, Resend will reject sends from this
 * address; this is a manual one-time setup step, not something
 * scriptable with the currently configured (send-only-scoped) API key.
 * See tasks/brand-playbook.md, "Ample Logistics" section.
 */
const LOGISTICS_FROM = `${LOGISTICS.emailFrom} <${LOGISTICS.emailAddress}>`;

function urgencyLabel(urgency: string): string {
  const map: Record<string, string> = {
    immediate: "Immediate",
    within_24_hours: "Within 24 Hours",
    within_7_days: "Within 7 Days",
    planned_future_requirement: "Planned Future Requirement",
  };
  return map[urgency] ?? urgency;
}

function emailShell(headerColor: string, headingEmoji: string, heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F6F8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:${headerColor};border-radius:10px 10px 0 0;padding:28px 36px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${headingEmoji} ${heading}</h1>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px 36px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 10px 10px;">
          ${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;width:160px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:${LOGISTICS.colors.navy};">${value}</td>
  </tr>`;
}

export interface DriverRequestEmailPayload {
  reference: string;
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  jobLocation: string;
  driversRequired: number;
  licenceCategory: string;
  startDate?: string | null;
  assignmentDuration?: string | null;
  shiftType?: string | null;
  urgency: string;
  additionalInfo?: string | null;
  dashboardId: string;
}

/**
 * Notifies the business owner of a new HGV driver request. Best-effort —
 * the submission itself is already saved before this runs, so a failed
 * email never loses the lead; see app/api/logistics/driver-requests/route.ts.
 */
export async function sendDriverRequestNotification(payload: DriverRequestEmailPayload): Promise<void> {
  try {
    const urgency = urgencyLabel(payload.urgency);
    const isUrgent = payload.urgency === "immediate" || payload.urgency === "within_24_hours";
    const dashboardLink = `${SITE_URL}/admin/logistics/driver-requests/${payload.dashboardId}`;

    const rows = [
      row("Company", payload.companyName),
      row("Contact", payload.contactPerson),
      row("Email", `<a href="mailto:${payload.businessEmail}" style="color:${LOGISTICS.colors.blue};">${payload.businessEmail}</a>`),
      row("Phone", `<a href="tel:${payload.phone.replace(/\s/g, "")}" style="color:${LOGISTICS.colors.blue};">${payload.phone}</a>`),
      row("Location", payload.jobLocation),
      row("Drivers Required", String(payload.driversRequired)),
      row("Licence Category", payload.licenceCategory),
      row("Start Date", payload.startDate ?? "Not specified"),
      row("Duration", payload.assignmentDuration ?? "Not specified"),
      row("Shift", payload.shiftType ?? "Not specified"),
      row("Urgency", urgency),
      row("Reference", payload.reference),
    ].join("");

    const body = `
      ${isUrgent ? `<p style="margin:0 0 16px;padding:10px 14px;background:#fef3c7;border-left:4px solid ${LOGISTICS.colors.amber};border-radius:6px;font-size:14px;font-weight:700;color:#713f12;">⚠️ Marked ${urgency} — please action promptly.</p>` : ""}
      <p style="margin:0 0 16px;font-size:15px;color:#283341;">A new HGV driver request has been received.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${rows}</table>
      ${payload.additionalInfo ? `<p style="margin:0 0 20px;font-size:14px;color:#475569;"><strong>Additional requirements:</strong> ${payload.additionalInfo}</p>` : ""}
      <p style="text-align:center;margin:24px 0 0;">
        <a href="${dashboardLink}" style="display:inline-block;background:${LOGISTICS.colors.blue};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">VIEW REQUEST IN DASHBOARD</a>
      </p>`;

    const html = emailShell(LOGISTICS.colors.navy, "🚚", "New HGV Driver Request", body);

    await sendEmail({
      to: LOGISTICS.notifyEmail,
      from: LOGISTICS_FROM,
      subject: `${isUrgent ? "URGENT: " : ""}New HGV Driver Request — Ample Logistics — ${urgency}`,
      html,
    });
  } catch (err) {
    await logError({
      message: `sendDriverRequestNotification failed: ${err instanceof Error ? err.message : String(err)}`,
      metadata: { reference: payload.reference },
    });
  }
}

export interface DriverApplicationEmailPayload {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  townCity: string;
  postcode: string;
  licenceCategory: string;
  experienceYears?: string | null;
  driverCpcStatus?: string | null;
  tachoCardStatus?: string | null;
  preferredWorkType?: string | null;
  preferredPattern?: string | null;
  availability?: string | null;
  preferredLocations?: string | null;
  hasCV: boolean;
  dashboardId: string;
}

/** Notifies the business owner of a new HGV driver application. Best-effort. */
export async function sendDriverApplicationNotification(payload: DriverApplicationEmailPayload): Promise<void> {
  try {
    const dashboardLink = `${SITE_URL}/admin/logistics/driver-applications/${payload.dashboardId}`;

    const rows = [
      row("Applicant", payload.fullName),
      row("Phone", `<a href="tel:${payload.phone.replace(/\s/g, "")}" style="color:${LOGISTICS.colors.blue};">${payload.phone}</a>`),
      row("Email", `<a href="mailto:${payload.email}" style="color:${LOGISTICS.colors.blue};">${payload.email}</a>`),
      row("Location", `${payload.townCity}, ${payload.postcode}`),
      row("Licence Category", payload.licenceCategory),
      row("Experience", payload.experienceYears ?? "Not specified"),
      row("Driver CPC", payload.driverCpcStatus ?? "Not specified"),
      row("Tachograph Card", payload.tachoCardStatus ?? "Not specified"),
      row("Preferred Work Type", payload.preferredWorkType ?? "Not specified"),
      row("Preferred Shifts", payload.preferredPattern ?? "Not specified"),
      row("Availability", payload.availability ?? "Not specified"),
      row("Preferred Locations", payload.preferredLocations ?? "Not specified"),
      row("Reference", payload.reference),
    ].join("");

    const body = `
      <p style="margin:0 0 16px;font-size:15px;color:#283341;">A new HGV driver application has been received.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${rows}</table>
      ${payload.hasCV ? `<p style="margin:0 0 20px;font-size:13px;color:#64748b;">📄 A CV was submitted and is available securely in the dashboard.</p>` : ""}
      <p style="text-align:center;margin:24px 0 0;">
        <a href="${dashboardLink}" style="display:inline-block;background:${LOGISTICS.colors.blue};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">VIEW DRIVER APPLICATION</a>
      </p>`;

    const html = emailShell(LOGISTICS.colors.navy, "🧑‍✈️", "New HGV Driver Application", body);

    await sendEmail({
      to: LOGISTICS.notifyEmail,
      from: LOGISTICS_FROM,
      subject: `New HGV Driver Application — ${payload.fullName} — ${payload.licenceCategory}`,
      html,
    });
  } catch (err) {
    await logError({
      message: `sendDriverApplicationNotification failed: ${err instanceof Error ? err.message : String(err)}`,
      metadata: { reference: payload.reference },
    });
  }
}
