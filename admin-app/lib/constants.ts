import type {
  BookingStatus,
  ServiceType,
  DriverStatus,
  JobStatusUpdate,
  EarningsStatus,
  InvoiceStatus,
} from "@/types";

// ── Invoice status ─────────────────────────────────────────────────────────
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_COLOURS: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-slate-200 text-slate-500",
  cancelled: "bg-slate-200 text-slate-500",
};

// ── Booking status labels ──────────────────────────────────────────────────
export const STATUS_LABELS: Record<BookingStatus, string> = {
  inquiry: "Inquiry",
  called: "Called - Answered",
  not_called: "Called - Not Answered",
  answered: "Called - Answered",
  not_answered: "Called - Not Answered",
  processing: "Pending",
  pending: "Pending",
  deposit_invoice_sent: "Deposit Invoice Sent",
  deposit_paid_job_confirmed: "Job Confirmed",
  full_invoice_sent: "Full Invoice Sent",
  full_balance_paid: "Full Balance Paid",
  job_completed: "Job Completed",
  bad_lead: "Bad Lead",
  not_a_good_fit: "Not a Good Fit",
};

// Pill background + text classes (NativeWind).
export const STATUS_COLOURS: Record<BookingStatus, string> = {
  inquiry: "bg-red-100 text-red-700",
  called: "bg-red-100 text-red-700",
  not_called: "bg-red-100 text-red-700",
  answered: "bg-red-100 text-red-700",
  not_answered: "bg-red-100 text-red-700",
  processing: "bg-yellow-100 text-yellow-700",
  pending: "bg-yellow-100 text-yellow-700",
  deposit_invoice_sent: "bg-violet-100 text-violet-700",
  deposit_paid_job_confirmed: "bg-green-500 text-white",
  full_invoice_sent: "bg-purple-100 text-purple-700",
  full_balance_paid: "bg-emerald-100 text-emerald-700",
  job_completed: "bg-green-600 text-white",
  bad_lead: "bg-red-100 text-red-700",
  not_a_good_fit: "bg-rose-100 text-rose-700",
};

/**
 * Whole-card tint per booking status (mirrors the web's coloured rows).
 * Light, balanced tints with a strong coloured left accent so status reads at
 * a glance without hurting contrast. Used on booking cards across the app.
 */
export const STATUS_ROW: Record<BookingStatus, string> = {
  inquiry:                    "bg-orange-100 border-l-4 border-l-orange-500",
  called:                     "bg-rose-50 border-l-4 border-l-rose-400",
  not_called:                 "bg-rose-50 border-l-4 border-l-rose-400",
  answered:                   "bg-rose-50 border-l-4 border-l-rose-400",
  not_answered:               "bg-rose-50 border-l-4 border-l-rose-400",
  processing:                 "bg-amber-50 border-l-4 border-l-amber-400",
  pending:                    "bg-amber-50 border-l-4 border-l-amber-400",
  deposit_invoice_sent:       "bg-violet-50 border-l-4 border-l-violet-500",
  deposit_paid_job_confirmed: "bg-green-100 border-l-4 border-l-green-600",
  full_invoice_sent:          "bg-purple-50 border-l-4 border-l-purple-500",
  full_balance_paid:          "bg-emerald-50 border-l-4 border-l-emerald-500",
  job_completed:              "bg-green-50 border-l-4 border-l-green-600",
  bad_lead:                   "bg-red-50 border-l-4 border-l-red-400",
  not_a_good_fit:             "bg-rose-50 border-l-4 border-l-rose-400",
};

export const STATUS_DOT_COLOURS: Record<BookingStatus, string> = {
  inquiry: "bg-orange-500",
  called: "bg-red-400",
  not_called: "bg-red-400",
  answered: "bg-red-400",
  not_answered: "bg-red-400",
  processing: "bg-yellow-500",
  pending: "bg-yellow-500",
  deposit_invoice_sent: "bg-violet-500",
  deposit_paid_job_confirmed: "bg-green-600",
  full_invoice_sent: "bg-purple-500",
  full_balance_paid: "bg-emerald-500",
  job_completed: "bg-green-700",
  bad_lead: "bg-red-500",
  not_a_good_fit: "bg-rose-500",
};

export const ALL_STATUSES: BookingStatus[] = [
  "inquiry", "called", "not_called", "answered", "not_answered",
  "processing", "pending", "deposit_invoice_sent",
  "deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid",
  "job_completed", "bad_lead", "not_a_good_fit",
];

// Columns shown on the pipeline / kanban (side-exits excluded).
export const PIPELINE_STATUSES: BookingStatus[] = [
  "inquiry", "pending", "deposit_invoice_sent",
  "deposit_paid_job_confirmed", "full_invoice_sent", "full_balance_paid",
  "job_completed",
];

// ── Service labels & colours ───────────────────────────────────────────────
export const SERVICE_LABELS: Record<ServiceType, string> = {
  removals: "Home & Business Removals",
  man_and_van: "Man and Van",
  house_clearance: "House Clearance",
  house_cleaning: "House Cleaning",
  end_of_tenancy: "End of Tenancy Cleaning",
};

export const SERVICE_LABELS_SHORT: Record<ServiceType, string> = {
  removals: "Removals",
  man_and_van: "Man & Van",
  house_clearance: "House Clearance",
  house_cleaning: "House Cleaning",
  end_of_tenancy: "End of Tenancy",
};

export const SERVICE_COLOURS: Record<ServiceType, string> = {
  removals: "bg-purple-600 text-white",
  man_and_van: "bg-blue-600 text-white",
  house_clearance: "bg-orange-500 text-white",
  house_cleaning: "bg-teal-600 text-white",
  end_of_tenancy: "bg-pink-600 text-white",
};

// ── Driver status ──────────────────────────────────────────────────────────
export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  on_leave: "On Leave",
};

export const DRIVER_STATUS_COLOURS: Record<DriverStatus, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-700",
  suspended: "bg-red-100 text-red-700",
  on_leave: "bg-amber-100 text-amber-700",
};

// ── Driver job status updates ──────────────────────────────────────────────
export const JOB_STATUS_LABELS: Record<JobStatusUpdate, string> = {
  on_my_way: "On My Way",
  twenty_mins_away: "20 Minutes Away",
  ten_mins_away: "10 Minutes Away",
  fifteen_mins_to_delivery: "15 Mins to Delivery",
  job_completed: "Job Completed",
};

// ── Earnings status ────────────────────────────────────────────────────────
export const EARNINGS_STATUS_LABELS: Record<EarningsStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  disputed: "Disputed",
};

export const EARNINGS_STATUS_COLOURS: Record<EarningsStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-blue-100 text-blue-700",
  disputed: "bg-red-100 text-red-700",
};
