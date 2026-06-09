import type { BookingStatus, ServiceType } from "@/types";

// ── Status labels ──────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  inquiry:                    "Inquiry",
  called:                     "Called - Answered",
  not_called:                 "Called - Not Answered",
  answered:                   "Called - Answered",
  not_answered:               "Called - Not Answered",
  processing:                 "Pending", // Processing removed, show as Pending
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
  inquiry:                    "bg-red-100 text-red-700", // Badge color (row is bright orange)
  called:                     "bg-red-100 text-red-700", // Light red - called and answered
  not_called:                 "bg-red-100 text-red-700", // Light red - called but not answered
  answered:                   "bg-red-100 text-red-700", // Light red - answered
  not_answered:               "bg-red-100 text-red-700", // Light red - not answered
  processing:                 "bg-yellow-100 text-yellow-700", // Same as pending
  pending:                    "bg-yellow-100 text-yellow-700",
  deposit_invoice_sent:       "bg-violet-100 text-violet-700",
  deposit_paid_job_confirmed: "bg-green-500 text-white", // Green - job confirmed
  full_invoice_sent:          "bg-purple-100 text-purple-700",
  full_balance_paid:          "bg-emerald-100 text-emerald-700",
  job_completed:              "bg-green-600 text-white", // Strong green - completed
  bad_lead:                   "bg-red-100 text-red-700",
  not_a_good_fit:             "bg-rose-100 text-rose-700",
};

export const STATUS_DOT_COLOURS: Record<BookingStatus, string> = {
  inquiry:                    "bg-orange-500", // Orange dot for not contacted
  called:                     "bg-red-400", // Light red
  not_called:                 "bg-red-400", // Light red
  answered:                   "bg-red-400", // Light red
  not_answered:               "bg-red-400", // Light red
  processing:                 "bg-yellow-500",
  pending:                    "bg-yellow-500",
  deposit_invoice_sent:       "bg-violet-500",
  deposit_paid_job_confirmed: "bg-green-600", // Green for confirmed
  full_invoice_sent:          "bg-purple-500",
  full_balance_paid:          "bg-emerald-500",
  job_completed:              "bg-green-700", // Dark green for completed
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

// ── PHASE 11: Driver Status Labels & Colors ────────────────────────────────

import type { DriverStatus, JobStatusUpdate, EarningsStatus } from "@/types";

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  on_leave: "On Leave",
};

export const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  active: "green",
  inactive: "slate",
  suspended: "red",
  on_leave: "amber",
};

export const JOB_STATUS_LABELS: Record<JobStatusUpdate, string> = {
  on_my_way: "On My Way",
  twenty_mins_away: "20 Minutes Away",
  ten_mins_away: "10 Minutes Away",
  fifteen_mins_to_delivery: "15 Mins to Delivery",
  job_completed: "Job Completed",
};

export const JOB_STATUS_COLORS: Record<JobStatusUpdate, string> = {
  on_my_way: "purple",
  twenty_mins_away: "blue",
  ten_mins_away: "amber",
  fifteen_mins_to_delivery: "orange",
  job_completed: "green",
};

export const EARNINGS_STATUS_LABELS: Record<EarningsStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  disputed: "Disputed",
};

export const EARNINGS_STATUS_COLORS: Record<EarningsStatus, string> = {
  pending: "slate",
  approved: "green",
  paid: "green",
  disputed: "red",
};
