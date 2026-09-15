import { OPENING_HOURS_SPEC } from "@/lib/company";
import { COMPANY_PHONE } from "@/lib/constants";

// Derived from the single source of truth in lib/company.ts ("08:00"/"18:00")
// so the two can never drift apart.
const [OPEN_HOUR] = OPENING_HOURS_SPEC[0].opens.split(":").map(Number);
const [CLOSE_HOUR] = OPENING_HOURS_SPEC[0].closes.split(":").map(Number);

/** UK wall-clock hour right now (Europe/London), correct across BST/GMT. */
function ukHourNow(): number {
  return Number(new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }));
}

export function isWithinBusinessHours(): boolean {
  const h = ukHourNow();
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

export interface AssignmentMessage {
  /** Short heading for on-page display. */
  heading: string;
  /** Full sentence — used in email body / page copy. */
  line: string;
  /** Compact variant, safe for a GSM-7 SMS alongside other text. */
  short: string;
  /** Separate call-out so the number can be styled/linked on its own. */
  phoneNote: string;
}

/**
 * What a customer sees/is told after submitting an enquiry — no price, just
 * a warm, personal promise of when their own move coordinator will call,
 * varying by whether we're inside business hours (8am-6pm, 7 days —
 * lib/company.ts) right now.
 */
export function getAssignmentMessage(): AssignmentMessage {
  const phoneNote = `We'll be calling from ${COMPANY_PHONE} — do save it, so you know it's us!`;
  if (isWithinBusinessHours()) {
    return {
      heading: "Your dedicated move coordinator is on it!",
      line: "We've personally assigned you a dedicated move coordinator, and they're looking at your details right now. Expect a call within the next 30 minutes to talk through your move and put together your quote — we can't wait to help.",
      short: "Your dedicated move coordinator will call you within 30 minutes to talk through your move and give you a quote.",
      phoneNote,
    };
  }
  return {
    heading: "Your dedicated move coordinator is on it!",
    line: "We've personally assigned you a dedicated move coordinator. They'll call you today to talk through your move and put together your quote — and if it's too late today, they'll be one of the first calls made tomorrow, from 8am.",
    short: "Your dedicated move coordinator will call you today if there's time, or by 8am tomorrow, to talk through your move and give you a quote.",
    phoneNote,
  };
}
