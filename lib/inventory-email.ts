/**
 * Shared HTML blocks for showing a customer's inventory ("what you're moving")
 * in emails — the booking confirmation and the pre-move reminders. Kept in one
 * place so the list looks the same everywhere. Reminder times/quantities are the
 * customer's own selections from the booking wizard.
 */

interface InvItem {
  key?: string;
  label: string;
  variant?: string;
  quantity: number;
}

const BUSINESS_PHONE = "0333 577 2070";

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

function items(inventory: unknown): InvItem[] {
  return Array.isArray(inventory)
    ? (inventory as InvItem[]).filter((i) => i && i.label && (i.quantity ?? 0) > 0)
    : [];
}

/** A simple, readable two-column list of the items. Returns "" when there are none. */
export function inventoryListHtml(inventory: unknown): string {
  const list = items(inventory);
  if (!list.length) return "";
  const rows = list
    .map((i) => `<tr>
        <td style="padding:6px 0;color:#334155;border-bottom:1px solid #eef2f7;">${escapeHtml(i.label)}</td>
        <td style="padding:6px 0;text-align:right;font-weight:bold;color:#6b21a8;border-bottom:1px solid #eef2f7;">×${i.quantity}</td>
      </tr>`)
    .join("");
  const total = list.reduce((n, i) => n + (i.quantity || 0), 0);
  return `<table style="width:100%;font-size:14px;border-collapse:collapse;">
      ${rows}
      <tr><td style="padding:10px 0 0;color:#64748b;font-size:13px;">Total items</td>
          <td style="padding:10px 0 0;text-align:right;color:#64748b;font-size:13px;font-weight:bold;">${total}</td></tr>
    </table>`;
}

/** "What you're moving" block for the booking-request confirmation email. */
export function bookingItemsBlockHtml(inventory: unknown): string {
  const list = inventoryListHtml(inventory);
  if (!list) return "";
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 10px;font-weight:bold;color:#0f172a;font-size:15px;">📦 What you told us you're moving</p>
      ${list}
      <p style="margin:14px 0 0;color:#64748b;font-size:13px;">Missing something or got more? Just reply to this email or call us on <strong>${BUSINESS_PHONE}</strong> and we'll add it.</p>
    </div>`;
}

/**
 * "Here's your list — got more? tell us" block for the pre-move reminders.
 * Always renders (even with no items) so the "let us know if you have more"
 * message and our number always appear.
 */
export function moreItemsBlockHtml(inventory: unknown, phone: string = BUSINESS_PHONE): string {
  const list = inventoryListHtml(inventory);
  const listPart = list
    ? `<p style="margin:0 0 10px;font-weight:bold;color:#5b21b6;font-size:15px;">📦 Here's what we've got on your list</p>${list}`
    : `<p style="margin:0 0 10px;font-weight:bold;color:#5b21b6;font-size:15px;">📦 Your moving list</p>
       <p style="color:#64748b;font-size:14px;margin:0;">We don't have an item list saved for you yet.</p>`;
  return `<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:16px;margin:20px 0;">
      ${listPart}
      <p style="margin:14px 0 0;color:#475569;font-size:14px;"><strong>Got more than this?</strong> Please let us know so we bring the right van and team — call or WhatsApp us on <strong>${phone}</strong>.</p>
    </div>`;
}

/** Short one-liner for SMS/WhatsApp reminders (no full list). */
export function moreItemsLine(phone: string = BUSINESS_PHONE): string {
  return `Got more items than we have on your list? Let us know on ${phone} so we bring the right van & team.`;
}
