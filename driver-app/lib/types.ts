/** Shapes returned by the /api/drivers/** routes. Kept loose where the server
 *  selects "*", strict on the fields the UI actually reads. */

export interface Address {
  id?: string;
  line_1?: string | null;
  line_2?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  postcode_outward?: string | null; // completed jobs: only the outward code survives
  lat?: number | null;
  lng?: number | null;
}

export interface Customer {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface Job {
  id: string;
  reference: string;
  service_type: string;
  status: string;
  move_date: string | null;
  move_time?: string | null;
  latest_driver_status?: string | null;
  description?: string | null;
  special_instructions?: string | null;
  // Move details the customer selected (from the instant-quote wizard)
  floor?: string | null;
  has_lift?: boolean | null;
  parking_within_20m?: boolean | null;
  inventory?: { key: string; label: string; variant?: string; quantity: number }[] | null;
  customer?: Customer | null;
  origin?: Address | null;
  destination?: Address | null;
  // Server-enforced visibility (lib/driver-job-view)
  acceptance_status?: "pending" | "accepted" | "declined" | null;
  role?: "driver" | "porter" | string | null;
  visibility_phase?: "pending" | "accepted" | "declined" | "completed" | null;
  decline_reason?: string | null;
  hours_until_job?: number | null;
  phone_unlocks_in_hours?: number | null;
  rating?: number | null; // completed jobs: the customer's rating
  // Journey / chain-of-custody state (from add_driver_app.sql)
  current_journey_leg?: "pickup" | "delivery" | null;
  journey_started_at?: string | null;
  arrived_at?: string | null;
  pickup_confirmed?: boolean | null;
  pickup_confirmed_at?: string | null;
  delivery_confirmed?: boolean | null;
  delivery_confirmed_at?: string | null;
  completed_at?: string | null;
  live_tracking_token?: string | null;
  call1_eta_timestamp?: string | null;
  call2_eta_timestamp?: string | null;
  call3_eta_timestamp?: string | null;
}

export interface ClockStatus {
  clocked_in: boolean;
  on_break: boolean;
  last_clock_in?: string | null;
  entries_today: { entry_type: string; at: string }[];
}

export interface DriverNotification {
  id: string;
  title: string;
  description?: string | null;
  is_read: boolean;
  created_at: string;
  booking_id?: string | null;
}
