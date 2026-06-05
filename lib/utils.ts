import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ServiceType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Per-service reference prefixes (spec STEP 7). */
const SERVICE_PREFIX: Record<ServiceType, string> = {
  removals: "RMV",
  man_and_van: "MAV",
  house_clearance: "HCL",
  house_cleaning: "CLN",
  end_of_tenancy: "EOT",
};

const ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomSuffix(length = 5): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return out;
}

/**
 * Generate a human-friendly booking reference, e.g. `RMV-2026-7F4QK`.
 */
export function generateBookingReference(serviceType: ServiceType): string {
  const prefix = SERVICE_PREFIX[serviceType] ?? "BKG";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${randomSuffix(5)}`;
}

/**
 * Generate an invoice number, e.g. `INV-2026-7F4QK`.
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${randomSuffix(5)}`;
}

/**
 * Format a numeric amount as GBP currency, e.g. `£1,250.00`.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/**
 * Format a date as `DD/MM/YYYY` (UK style).
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
