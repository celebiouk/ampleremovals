/**
 * Colour tokens — the single source of truth. Never use raw hex in components.
 * Brand purple + green are pulled verbatim from the web tailwind config.
 */
export const colors = {
  primary: {
    DEFAULT: "#6b21a8", // purple-800 — the soul of the brand
    light: "#9333ea", // purple-600
    lighter: "#a855f7", // purple-500
    dark: "#581c87", // purple-900
    darkest: "#3b0764", // purple-950
    surface: "#faf5ff", // purple-50
    surfaceMid: "#f3e8ff", // purple-100
    on: "#ffffff",
  },
  accent: {
    DEFAULT: "#16a34a", // green-600
    light: "#22c55e", // green-500
    lighter: "#4ade80", // green-400
    surface: "#f0fdf4", // green-50
    surfaceMid: "#dcfce7", // green-100
    on: "#ffffff",
  },
  danger: { DEFAULT: "#dc2626", surface: "#fee2e2", on: "#ffffff" },
  warning: { DEFAULT: "#ca8a04", surface: "#fef9c3" },
  white: "#ffffff",
  black: "#000000",
  slate: {
    950: "#020617",
    900: "#0f172a",
    800: "#1e293b",
    700: "#334155",
    600: "#475569",
    500: "#64748b",
    400: "#94a3b8",
    300: "#cbd5e1",
    200: "#e2e8f0",
    100: "#f1f5f9",
    50: "#f8fafc",
  },
} as const;

/** Per-status colours: bg tint, text, dot, and a strong row accent. */
export const statusColors = {
  inquiry:                    { bg: "#ffedd5", text: "#9a3412", dot: "#f97316", accent: "#f97316" },
  called:                     { bg: "#fff1f2", text: "#9f1239", dot: "#fb7185", accent: "#fb7185" },
  not_called:                 { bg: "#fff1f2", text: "#9f1239", dot: "#fb7185", accent: "#fb7185" },
  answered:                   { bg: "#fff1f2", text: "#9f1239", dot: "#fb7185", accent: "#fb7185" },
  not_answered:               { bg: "#fff1f2", text: "#9f1239", dot: "#fb7185", accent: "#fb7185" },
  processing:                 { bg: "#fef9c3", text: "#854d0e", dot: "#ca8a04", accent: "#eab308" },
  pending:                    { bg: "#fef9c3", text: "#854d0e", dot: "#ca8a04", accent: "#eab308" },
  deposit_invoice_sent:       { bg: "#f5f3ff", text: "#5b21b6", dot: "#8b5cf6", accent: "#8b5cf6" },
  deposit_paid_job_confirmed: { bg: "#dcfce7", text: "#065f46", dot: "#16a34a", accent: "#16a34a" },
  full_invoice_sent:          { bg: "#faf5ff", text: "#6b21a8", dot: "#a855f7", accent: "#a855f7" },
  full_balance_paid:          { bg: "#d1fae5", text: "#065f46", dot: "#059669", accent: "#059669" },
  job_completed:              { bg: "#dcfce7", text: "#166534", dot: "#16a34a", accent: "#15803d" },
  bad_lead:                   { bg: "#fee2e2", text: "#991b1b", dot: "#dc2626", accent: "#dc2626" },
  not_a_good_fit:             { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", accent: "#ef4444" },
} as const;

/** Per-service accent colours (badges). */
export const serviceColors = {
  removals:        "#6b21a8",
  man_and_van:     "#2563eb",
  house_clearance: "#ea580c",
  house_cleaning:  "#0d9488",
  end_of_tenancy:  "#db2777",
} as const;
