import type { BookingStatus, ServiceType } from "@/types";

// ── Status labels ──────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  inquiry:                    "Inquiry",
  called:                     "Called",
  not_called:                 "Not Called",
  answered:                   "Answered",
  not_answered:               "Not Answered",
  processing:                 "Processing",
  pending:                    "Pending",
  deposit_invoice_sent:       "Deposit Invoice Sent",
  deposit_paid_job_confirmed: "Job Confirmed",
  full_invoice_sent:          "Full Invoice Sent",
  full_balance_paid:          "Full Balance Paid",
  job_completed:              "Job Completed",
  bad_lead:                   "Bad Lead",
  not_a_good_fit:             "Not a Good Fit",
};

// ── Status badge colours (Tailwind classes) ────────────────────────────────

export const STATUS_COLOURS: Record<BookingStatus, string> = {
  inquiry:                    "bg-red-100 text-red-700", // Red to indicate not contacted yet
  called:                     "bg-blue-100 text-blue-700",
  not_called:                 "bg-amber-100 text-amber-700",
  answered:                   "bg-cyan-100 text-cyan-700",
  not_answered:               "bg-orange-100 text-orange-700",
  processing:                 "bg-indigo-100 text-indigo-700",
  pending:                    "bg-yellow-100 text-yellow-700",
  deposit_invoice_sent:       "bg-violet-100 text-violet-700",
  deposit_paid_job_confirmed: "bg-green-100 text-green-700",
  full_invoice_sent:          "bg-purple-100 text-purple-700",
  full_balance_paid:          "bg-emerald-100 text-emerald-700",
  job_completed:              "bg-green-200 text-green-900",
  bad_lead:                   "bg-red-100 text-red-700",
  not_a_good_fit:             "bg-rose-100 text-rose-700",
};

export const STATUS_DOT_COLOURS: Record<BookingStatus, string> = {
  inquiry:                    "bg-red-500", // Red dot for not contacted
  called:                     "bg-blue-500",
  not_called:                 "bg-amber-500",
  answered:                   "bg-cyan-500",
  not_answered:               "bg-orange-500",
  processing:                 "bg-indigo-500",
  pending:                    "bg-yellow-500",
  deposit_invoice_sent:       "bg-violet-500",
  deposit_paid_job_confirmed: "bg-green-500",
  full_invoice_sent:          "bg-purple-500",
  full_balance_paid:          "bg-emerald-500",
  job_completed:              "bg-green-700",
  bad_lead:                   "bg-red-500",
  not_a_good_fit:             "bg-rose-500",
};

// ── Service labels ─────────────────────────────────────────────────────────

export const SERVICE_LABELS: Record<ServiceType, string> = {
  removals:        "Home & Business Removals",
  man_and_van:     "Man and Van",
  house_clearance: "House Clearance",
  house_cleaning:  "House Cleaning",
  end_of_tenancy:  "End of Tenancy Cleaning",
};

export const SERVICE_LABELS_SHORT: Record<ServiceType, string> = {
  removals:        "Removals",
  man_and_van:     "Man & Van",
  house_clearance: "House Clearance",
  house_cleaning:  "House Cleaning",
  end_of_tenancy:  "End of Tenancy",
};

// ── Service badge colours ──────────────────────────────────────────────────

export const SERVICE_COLOURS: Record<ServiceType, string> = {
  removals:        "bg-purple-600 text-white",
  man_and_van:     "bg-blue-600 text-white",
  house_clearance: "bg-orange-500 text-white",
  house_cleaning:  "bg-teal-600 text-white",
  end_of_tenancy:  "bg-pink-600 text-white",
};

// ── Status pipeline groups ─────────────────────────────────────────────────

export const IN_PROGRESS_STATUSES: BookingStatus[] = [
  "called", "not_called", "answered", "not_answered",
  "processing", "pending", "deposit_invoice_sent",
  "deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid",
];

export const ALL_STATUSES: BookingStatus[] = [
  "inquiry", "called", "not_called", "answered", "not_answered",
  "processing", "pending", "deposit_invoice_sent",
  "deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid",
  "job_completed", "bad_lead", "not_a_good_fit",
];
