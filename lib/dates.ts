/**
 * UK-timezone date helpers.
 *
 * The business runs in the UK (Europe/London), but Vercel servers run in UTC.
 * Computing "today" with `new Date().toISOString()` therefore rolls over an hour
 * early (BST) / at midnight UTC — so a job dated today can look "past" in the
 * early hours. Always derive the working date in Europe/London, and compare
 * date-only values as YYYY-MM-DD strings (never Date objects, which JS parses as
 * UTC midnight).
 */

export const UK_TZ = "Europe/London";

/** Today's date in the UK as YYYY-MM-DD. */
export function ukToday(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: UK_TZ }).format(new Date());
}

/** A given instant's UK calendar date as YYYY-MM-DD. */
export function ukDateString(d: Date | string | number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: UK_TZ }).format(new Date(d));
}

/** Normalise any stored date/timestamp to its YYYY-MM-DD part (no tz maths). */
export function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

/** Monday-start week range (YYYY-MM-DD) containing the UK "today". */
export function ukWeekRange(): { start: string; end: string } {
  const today = ukToday();
  const d = new Date(today + "T12:00:00Z"); // noon UTC avoids any DST edge
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  const start = new Date(d); start.setUTCDate(d.getUTCDate() - dow);
  const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
