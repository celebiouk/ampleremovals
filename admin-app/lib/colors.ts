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

/**
 * Per-status colours: bg tint, text, dot, and a strong row accent (the left
 * line on each booking card). The accent mirrors the web's coloured rows for
 * the distinctive statuses (inquiry=orange, contacted=red, confirmed/paid/
 * completed=green) and uses brand purple for the in-between stages the web
 * leaves plain — so no row ever looks neutral/grey.
 */
export const statusColors = {
  inquiry:                    { bg: "#fed7aa", text: "#9a3412", dot: "#f97316", accent: "#f97316" }, // orange
  called:                     { bg: "#bfdbfe", text: "#1e40af", dot: "#3b82f6", accent: "#2563eb" }, // blue (answered)
  not_called:                 { bg: "#fed7aa", text: "#9a3412", dot: "#f97316", accent: "#f97316" }, // orange (not answered = inquiry)
  answered:                   { bg: "#bfdbfe", text: "#1e40af", dot: "#3b82f6", accent: "#2563eb" }, // blue (answered)
  not_answered:               { bg: "#fed7aa", text: "#9a3412", dot: "#f97316", accent: "#f97316" }, // orange (not answered = inquiry)
  processing:                 { bg: "#e9d5ff", text: "#6b21a8", dot: "#9333ea", accent: "#7e22ce" }, // purple
  pending:                    { bg: "#e9d5ff", text: "#6b21a8", dot: "#9333ea", accent: "#7e22ce" }, // purple
  quote_sent:                 { bg: "#e0f2fe", text: "#0369a1", dot: "#0ea5e9", accent: "#0284c7" }, // sky (awaiting confirmation)
  quote_confirmed:            { bg: "#ccfbf1", text: "#0f766e", dot: "#14b8a6", accent: "#0d9488" }, // teal (customer confirmed)
  deposit_invoice_sent:       { bg: "#e9d5ff", text: "#6b21a8", dot: "#9333ea", accent: "#7e22ce" }, // purple
  deposit_paid_job_confirmed: { bg: "#bbf7d0", text: "#065f46", dot: "#16a34a", accent: "#16a34a" }, // green
  full_invoice_sent:          { bg: "#e9d5ff", text: "#6b21a8", dot: "#9333ea", accent: "#7e22ce" }, // purple
  full_balance_paid:          { bg: "#a7f3d0", text: "#065f46", dot: "#059669", accent: "#16a34a" }, // green (paid)
  job_completed:              { bg: "#bbf7d0", text: "#166534", dot: "#16a34a", accent: "#16a34a" }, // green
  bad_lead:                   { bg: "#fecaca", text: "#991b1b", dot: "#dc2626", accent: "#dc2626" }, // red
  not_a_good_fit:             { bg: "#fecaca", text: "#991b1b", dot: "#ef4444", accent: "#dc2626" }, // red
} as const;

/** Per-service accent colours (badges). */
export const serviceColors = {
  removals:        "#6b21a8",
  man_and_van:     "#2563eb",
  house_clearance: "#ea580c",
  house_cleaning:  "#0d9488",
  end_of_tenancy:  "#db2777",
} as const;
