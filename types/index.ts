/**
 * Ample Removals — shared TypeScript types.
 * These mirror the PostgreSQL schema (see supabase/schema.sql).
 */

// ── Enums (mirror Postgres ENUM types) ────────────────────
export type ServiceType =
  | "removals"
  | "man_and_van"
  | "house_clearance"
  | "house_cleaning"
  | "end_of_tenancy";

export type RemovalType = "domestic" | "business";

export type PropertyType = "flat" | "house" | "bungalow";

export type BedroomCount = "studio" | "1" | "2" | "3" | "4" | "5+";

export type VanType = "small" | "medium" | "large";

export type CleaningType = "regular" | "deep" | "one_off";

export type CleaningFrequency =
  | "one_off"
  | "weekly"
  | "fortnightly"
  | "monthly";

export type ClearanceType = "full" | "partial" | "single_room";

export type BookingStatus =
  | "inquiry"
  | "called"
  | "not_called"
  | "answered"
  | "not_answered"
  | "processing"
  | "pending"
  | "quote_sent"
  | "quote_confirmed"
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
  | "cancelled";

// ── Core tables ───────────────────────────────────────────
export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  line_1: string;
  line_2: string | null;
  city: string | null;
  county: string | null;
  postcode: string;
  country: string;
  created_at: string;
}

export interface Booking {
  id: string;
  reference: string;
  service_type: ServiceType;
  customer_id: string;
  origin_address_id: string | null;
  destination_address_id: string | null;
  status: BookingStatus;
  move_date: string | null;
  is_flexible_date: boolean;
  flexible_date_from: string | null;
  flexible_date_to: string | null;
  description: string | null;
  internal_notes: string | null;
  source: string;
  heard_about_us?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  lead_score?: number | null;
  lead_band?: string | null;
  // Quote fields
  quote_line_items: QuoteLineItem[] | null;
  quote_subtotal: number | null;
  quote_vat_rate: number | null;
  quote_vat_amount: number | null;
  quote_total: number | null;
  quote_valid_until: string | null;
  quote_notes: string | null;
  quote_pdf_url: string | null;
  quote_sent_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined relations
  customer?: Customer;
  origin_address?: Address | null;
  destination_address?: Address | null;
}

// ── Service detail tables ─────────────────────────────────
export interface RemovalsDetails {
  id: string;
  booking_id: string;
  removal_type: RemovalType;
  property_type: PropertyType;
  bedrooms: BedroomCount;
}

export interface ManAndVanDetails {
  id: string;
  booking_id: string;
  van_type: VanType;
}

export interface HouseClearanceDetails {
  id: string;
  booking_id: string;
  clearance_type: ClearanceType;
  property_type: PropertyType;
  bedrooms: BedroomCount;
  items_of_note: string[];
}

export interface HouseCleaningDetails {
  id: string;
  booking_id: string;
  cleaning_type: CleaningType;
  frequency: CleaningFrequency;
  property_type: PropertyType;
  bedrooms: BedroomCount;
  preferred_time_slot: string | null;
  access_instructions: string | null;
}

export interface EndOfTenancyDetails {
  id: string;
  booking_id: string;
  property_type: PropertyType;
  bedrooms: BedroomCount;
  tenancy_end_date: string | null;
  access_instructions: string | null;
  addons: string[];
}

export interface AdditionalServices {
  id: string;
  booking_id: string;
  packing_services: boolean;
  packing_materials: boolean;
  disassemble_furniture: boolean;
  assemble_furniture: boolean;
}

// ── Activity / audit tables ───────────────────────────────
export interface BookingNote {
  id: string;
  booking_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

export interface StatusHistoryEntry {
  id: string;
  booking_id: string;
  previous_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by: string;
  changed_at: string;
}

export interface ActivityLogEntry {
  id: string;
  booking_id: string | null;
  customer_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  performed_by: string;
  created_at: string;
}

// ── Billing ───────────────────────────────────────────────
export interface QuoteLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string;
  customer_id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  due_date: string | null;
  stripe_payment_link: string | null;
  stripe_payment_intent_id: string | null;
  pdf_url: string | null;
  notes: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  booking_id: string;
  customer_id: string;
  amount: number;
  stripe_payment_intent_id: string | null;
  payment_method: string | null;
  paid_at: string;
}

export interface ServerLog {
  id: string;
  level: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── Admin System ──────────────────────────────────────────
export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  supabase_user_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string | null;
  admin_email: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── Quote PDF generation ──────────────────────────────────
export interface QuotePDFData {
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  origin_address: string;
  destination_address?: string;
  date: string;
  valid_until: string;
  line_items: QuoteLineItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  notes?: string;
}

// ── Composite / view models ───────────────────────────────
export interface BookingWithDetails extends Booking {
  customer: Customer;
  origin_address: Address | null;
  destination_address: Address | null;
  removals_details?: RemovalsDetails | null;
  man_and_van_details?: ManAndVanDetails | null;
  house_clearance_details?: HouseClearanceDetails | null;
  house_cleaning_details?: HouseCleaningDetails | null;
  end_of_tenancy_details?: EndOfTenancyDetails | null;
  additional_services?: AdditionalServices | null;
  notes?: BookingNote[];
  status_history?: StatusHistoryEntry[];
  invoices?: Invoice[];
}

// ── Postcode lookup ───────────────────────────────────────
export interface AddressOption {
  line_1: string;
  line_2?: string;
  city?: string;
  postcode: string;
}

export interface PostcodeResult {
  postcode: string;
  addresses: AddressOption[];
}

// ── Invoice PDF data ──────────────────────────────────────────────────────
export interface InvoicePDFData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  type: InvoiceType;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  originAddress: string;
  bookingReference: string;
  serviceType: string;
  moveDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  stripePaymentLink?: string; // Optional - not used with bank transfer
  notes?: string;
  // Deposit-specific fields
  fullJobValue?: number;
  depositPercentage?: number;
  balanceRemaining?: number;
}

// ── PHASE 11: Driver Management Types ────────────────────────

export type DriverStatus = "active" | "inactive" | "suspended" | "on_leave";

export type JobStatusUpdate =
  | "on_my_way"
  | "twenty_mins_away"
  | "ten_mins_away"
  | "fifteen_mins_to_delivery"
  | "job_completed";

export type EarningsStatus = "pending" | "approved" | "paid" | "disputed";

export interface Driver {
  id: string;
  auth_user_id: string | null;
  // Personal
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  date_of_birth: string; // Date string
  email: string;
  phone: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  // Address
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  // Employment
  status: DriverStatus;
  hire_date: string; // Date string
  driver_notes: string | null;
  // Pay
  default_pay_percentage: number; // e.g. 40.00 for 40%
  // Documents
  profile_photo_url: string | null;
  driving_licence_front_url: string | null;
  driving_licence_back_url: string | null;
  driving_licence_number: string | null;
  driving_licence_expiry: string | null; // Date string
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingDriverAssignment {
  id: string;
  booking_id: string;
  driver_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_lead_driver: boolean;
  notes: string | null;
  pay_percentage_override: number | null; // Override driver's default %
}

export interface DriverJobStatusUpdate {
  id: string;
  booking_id: string;
  driver_id: string;
  status: JobStatusUpdate;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface DriverEarnings {
  id: string;
  driver_id: string;
  booking_id: string;
  assignment_id: string;
  booking_total: number; // Total paid for booking
  pay_percentage: number; // % used for this calculation
  gross_earnings: number; // booking_total × (pay_percentage / 100)
  tip_amount: number; // Sum of tips
  total_earnings: number; // gross_earnings + tip_amount
  status: EarningsStatus;
  admin_notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverTip {
  id: string;
  driver_id: string;
  booking_id: string;
  amount: number;
  recorded_by: string; // 'admin' | 'stripe'
  note: string | null;
  created_at: string;
}
