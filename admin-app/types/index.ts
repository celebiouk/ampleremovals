/**
 * Core data types — ported from the web platform (types/index.ts).
 * Kept in sync with the Supabase schema so the mobile app and web app
 * share one mental model.
 */

export type ServiceType =
  | "removals"
  | "man_and_van"
  | "house_clearance"
  | "house_cleaning"
  | "end_of_tenancy";

export type BookingStatus =
  | "inquiry"
  | "called"
  | "not_called"
  | "answered"
  | "not_answered"
  | "processing"
  | "pending"
  | "deposit_invoice_sent"
  | "deposit_paid_job_confirmed"
  | "full_invoice_sent"
  | "full_balance_paid"
  | "job_completed"
  | "bad_lead"
  | "not_a_good_fit";

export type InvoiceType = "deposit" | "full_balance";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "void"
  | "cancelled";

export type AdminRole = "super_admin" | "admin";

export type DriverStatus = "active" | "inactive" | "suspended" | "on_leave";

export type JobStatusUpdate =
  | "on_my_way"
  | "twenty_mins_away"
  | "ten_mins_away"
  | "fifteen_mins_to_delivery"
  | "job_completed";

export type EarningsStatus = "pending" | "approved" | "paid" | "disputed";

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Address {
  id: string;
  line_1: string;
  line_2?: string | null;
  city?: string | null;
  postcode: string;
}

export interface Booking {
  id: string;
  reference: string;
  service_type: ServiceType;
  status: BookingStatus;
  customer_id: string;
  origin_address_id?: string | null;
  destination_address_id?: string | null;
  move_date?: string | null;
  quote_total?: number | null;
  latest_driver_status?: JobStatusUpdate | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string;
  customer_id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  due_date?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  booking_id: string;
  customer_id: string;
  amount: number;
  payment_method?: string | null;
  paid_at: string;
}

export interface Driver {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  phone: string;
  status: DriverStatus;
  default_pay_percentage: number;
  profile_photo_url: string | null;
  created_at: string;
}

export interface DriverEarnings {
  id: string;
  driver_id: string;
  booking_id: string;
  assignment_id: string;
  booking_total: number;
  pay_percentage: number;
  gross_earnings: number;
  tip_amount: number;
  total_earnings: number;
  status: EarningsStatus;
  paid_at: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string | null;
  role: AdminRole;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  booking_id?: string | null;
  read?: boolean;
  created_at: string;
}

export type UserType = "admin" | "driver" | "unknown";
