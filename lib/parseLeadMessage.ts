/**
 * Extracts a lead's name, email and phone from a pasted agency message so the
 * admin can copy-paste the whole thing instead of typing. Tolerant of the
 * common "Label: value" format, e.g.:
 *
 *   There is a new lead generated for Ample Logistics!
 *   Name: Daniel,
 *   Phone Number: 07368 274702,
 *   email: lindseypinsey1975@yahoo.co.uk
 *   Move Size: 2 bedroom
 *
 * Missing fields come back as empty strings — the admin can still fill them in.
 */
export interface ParsedLead {
  fullName: string;
  email: string;
  phone: string;
}

/** Trim and drop trailing punctuation left by "Daniel," style values. */
const clean = (s: string) => s.trim().replace(/[,;.]+$/, "").trim();

export function parseLeadMessage(text: string): ParsedLead {
  const t = text ?? "";

  const nameMatch = t.match(/(?:^|\n)\s*(?:full\s*name|name|customer)\s*[:\-]\s*([^\n,]+)/i);

  // Prefer a labelled email; otherwise grab the first email-looking token.
  const emailLabel = t.match(/(?:^|\n)\s*e-?mail(?:\s*address)?\s*[:\-]\s*([^\s,\n]+)/i);
  const emailAny = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);

  // Prefer a labelled phone; otherwise grab a UK mobile/landline-looking run.
  const phoneLabel = t.match(/(?:^|\n)\s*(?:phone(?:\s*number)?|mobile|tel(?:ephone)?|contact(?:\s*number)?)\s*[:\-]\s*([+\d][\d\s()+-]{6,})/i);
  const phoneAny = t.match(/(?:\+44\s?7\d|\b0\d)[\d\s()+-]{7,}/);

  const fullName = nameMatch ? clean(nameMatch[1]) : "";
  const email = clean(emailLabel?.[1] ?? emailAny?.[0] ?? "").toLowerCase();
  const phoneRaw = phoneLabel?.[1] ?? phoneAny?.[0] ?? "";
  const phone = phoneRaw.replace(/[^\d+]/g, "");

  return { fullName, email, phone };
}
