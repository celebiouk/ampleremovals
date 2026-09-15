import { OPENING_HOURS_SPEC } from "@/lib/company";

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
}

/**
 * What a customer sees/is told after submitting an enquiry — no price, just
 * an honest promise of when a real person will call, varying by whether
 * we're inside business hours (8am-6pm, 7 days — lib/company.ts) right now.
 */
export function getAssignmentMessage(): AssignmentMessage {
  if (isWithinBusinessHours()) {
    return {
      heading: "You've been assigned to a member of our team",
      line: "A member of our team has been assigned to your enquiry and will call you within the next 30 minutes to talk through your move and give you a quote.",
      short: "A member of our team will call you within 30 minutes to talk through your move and give you a quote.",
    };
  }
  return {
    heading: "You've been assigned to a member of our team",
    line: "A member of our team has been assigned to your enquiry. They'll call you today to talk through your move and give you a quote — and if it's too late today, they'll call first thing tomorrow, from 8am.",
    short: "A member of our team will call you today if there's time, or by 8am tomorrow, to talk through your move and give you a quote.",
  };
}
