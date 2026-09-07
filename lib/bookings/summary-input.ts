/**
 * Maps a validated Removals form (and, for the cron, a DB booking row) into the
 * shared BookingSummaryInput used by the "everything you supplied" email.
 */
import type { BookingSummaryInput, AddressInfo } from "@/lib/booking-summary-email";
import type { RemovalsForm } from "@/lib/schemas/booking";
import type { AddressOption } from "@/types";

const SERVICE_LABEL = "Removals";

function fmtAddress(a?: AddressOption | null): string {
  if (!a) return "—";
  return [a.line_1, a.line_2, a.city, a.postcode].filter(Boolean).join(", ");
}

function fmtDateText(data: {
  isFlexibleDate?: boolean;
  moveDate?: Date | string;
  flexibleDateFrom?: Date | string;
  flexibleDateTo?: Date | string;
}): string {
  const fmt = (d?: Date | string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;
  if (data.isFlexibleDate) {
    const from = fmt(data.flexibleDateFrom);
    const to = fmt(data.flexibleDateTo);
    if (from && to) return `Flexible: ${from} – ${to}`;
    return "Flexible dates";
  }
  return fmt(data.moveDate) ?? "To be confirmed";
}

/** Human list of the extra services + quantities the customer chose. */
export function extrasList(input: {
  additionalServices?: {
    packing_services?: boolean;
    packing_materials?: boolean;
    disassemble_furniture?: boolean;
    assemble_furniture?: boolean;
  } | null;
  packingHours?: number | null;
  packingMen?: number | null;
  dismantleCount?: number | null;
  assembleCount?: number | null;
}): string[] {
  const out: string[] = [];
  const s = input.additionalServices ?? {};
  const ph = Number(input.packingHours) || 0;
  const men = Number(input.packingMen) || 1;
  if (s.packing_services || ph > 0) {
    out.push(ph > 0 ? `Packing help — ${men} ${men === 1 ? "person" : "people"}, ${ph} hour${ph === 1 ? "" : "s"}` : "Packing service");
  }
  if (s.packing_materials) out.push("Packing materials supplied");
  const dc = Number(input.dismantleCount) || 0;
  const ac = Number(input.assembleCount) || 0;
  if (s.disassemble_furniture || dc > 0) out.push(dc > 0 ? `Furniture dismantling — ${dc} item${dc === 1 ? "" : "s"}` : "Furniture dismantling");
  if (s.assemble_furniture || ac > 0) out.push(ac > 0 ? `Furniture assembling — ${ac} item${ac === 1 ? "" : "s"}` : "Furniture assembling");
  return out;
}

const first = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Build the same summary from a DB booking row (used by the 3-days-before cron).
 * The row must select the customer, origin/destination addresses, access + dest
 * access columns, quote_total, inventory, removals_details and additional_services.
 */
export function buildSummaryFromBookingRow(
  row: any,
  overrides?: { heading?: string; intro?: string },
): BookingSummaryInput {
  const customer = first<any>(row.customer) ?? {};
  const origin = first<any>(row.origin);
  const destination = first<any>(row.destination);
  const details = first<any>(row.removals_details) ?? {};
  const services = first<any>(row.additional_services) ?? {};

  const from: AddressInfo = {
    address: fmtAddress(origin),
    access: { floor: row.floor, hasLift: row.has_lift ?? false, parking: row.parking_within_20m, notes: row.special_instructions },
  };
  const to: AddressInfo = {
    address: fmtAddress(destination),
    access: { floor: row.dest_floor, hasLift: row.dest_has_lift ?? false, parking: row.dest_parking_within_20m, notes: row.dest_access_notes },
  };
  return {
    reference: row.reference,
    customerName: customer.full_name ?? "there",
    email: customer.email,
    phone: customer.phone,
    serviceLabel: SERVICE_LABEL,
    dateText: fmtDateText({
      isFlexibleDate: row.is_flexible_date,
      moveDate: row.move_date,
      flexibleDateFrom: row.flexible_date_from,
      flexibleDateTo: row.flexible_date_to,
    }),
    from,
    to: destination ? to : null,
    propertyType: details.property_type,
    bedrooms: details.bedrooms,
    inventory: Array.isArray(row.inventory) ? row.inventory.map((i: any) => ({ label: i.label, quantity: i.quantity })) : [],
    extras: extrasList({
      additionalServices: services,
      packingHours: services.packing_hours,
      packingMen: services.packing_men,
      dismantleCount: services.dismantle_count,
      assembleCount: services.assemble_count,
    }),
    description: row.description,
    quoteTotal: row.quote_total ?? null,
    ...overrides,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function buildRemovalsSummary(
  data: RemovalsForm,
  reference: string,
  quoteTotal: number | null,
): BookingSummaryInput {
  const from: AddressInfo = {
    address: fmtAddress(data.originAddress),
    access: { floor: data.floor, hasLift: data.hasLift ?? false, parking: data.parkingWithin20m, notes: data.specialInstructions },
  };
  const to: AddressInfo = {
    address: fmtAddress(data.destinationAddress),
    access: { floor: data.destFloor, hasLift: data.destHasLift ?? false, parking: data.destParkingWithin20m, notes: data.destAccessNotes },
  };
  return {
    reference,
    customerName: data.fullName,
    email: data.email,
    phone: data.phone,
    serviceLabel: SERVICE_LABEL,
    dateText: fmtDateText(data),
    from,
    to,
    propertyType: data.propertyType,
    bedrooms: data.bedrooms,
    inventory: Array.isArray(data.inventory) ? data.inventory.map((i) => ({ label: i.label, quantity: i.quantity })) : [],
    extras: extrasList(data),
    description: data.description,
    quoteTotal,
  };
}
