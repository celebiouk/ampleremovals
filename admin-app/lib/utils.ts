import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional Tailwind class strings (same helper as the web app). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a numeric amount as GBP, e.g. `£1,250.00`. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/** Format a date as `DD/MM/YYYY` (UK style). */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

/** Format a date/time as `DD/MM/YYYY HH:MM`. */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()} ${hours}:${minutes}`;
}

/**
 * Customer-facing arrival window for a job — mirrors lib/dates.ts on the web.
 * `move_time` stores a single "HH:MM" start time; the customer is always
 * shown a 1-hour window starting there. No time set yet defaults to
 * "9:00 am – 10:00 am", the company's standard arrival window.
 */
export const DEFAULT_MOVE_TIME = "09:00";

export function formatMoveTimeWindow(moveTime?: string | null): string {
  const [hStr, mStr] = (moveTime?.trim() || DEFAULT_MOVE_TIME).split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const start = new Date(2000, 0, 1, h, m);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined, hour12: true });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Local YYYY-MM-DD for a date (avoids UTC off-by-one). */
export function toDateKey(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

/**
 * How a customer's name is displayed across admin: always full uppercase,
 * whatever case it was entered in. Presentation-only (mirrors the web app's
 * upperName) — the stored name keeps its original casing.
 */
export function upperName(name?: string | null): string {
  return (name ?? "").toUpperCase();
}

/** Privacy-safe customer label: "Jane S." */
export function customerShortName(fullName?: string | null): string {
  if (!fullName) return "Customer";
  const [first, last] = fullName.split(" ");
  return last ? `${first} ${last[0]}.` : first;
}
