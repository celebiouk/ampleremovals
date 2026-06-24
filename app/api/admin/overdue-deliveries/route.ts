/**
 * GET /api/admin/overdue-deliveries — jobs whose date has passed but that aren't
 * completed yet (driver hasn't marked delivery done). Surfaces "items still out"
 * so the office can chase them. Used by the admin app + dashboard.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { ukToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    const today = ukToday();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, reference, status, move_date, move_time, pickup_confirmed, delivery_confirmed, current_journey_leg, completed_at, " +
          "customer:customers(full_name, phone), " +
          "origin:addresses!origin_address_id(line_1, city, postcode), " +
          "destination:addresses!destination_address_id(line_1, city, postcode), " +
          "assignments:booking_driver_assignments(driver:drivers(first_name, last_name, preferred_name))"
      )
      .lt("move_date", today)
      .is("completed_at", null)
      .order("move_date", { ascending: true });
    if (error) throw new Error(error.message);

    // Only those actually out with a driver (assigned), and not a side-exit status.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobs = (data ?? [])
      .filter((b: any) => Array.isArray(b.assignments) && b.assignments.length > 0)
      .filter((b: any) => !["bad_lead", "not_a_good_fit", "cancelled"].includes(b.status))
      .map((b: any) => {
        const drivers = (b.assignments ?? [])
          .map((a: any) => {
            const d = a.driver;
            return d ? d.preferred_name || [d.first_name, d.last_name].filter(Boolean).join(" ") : null;
          })
          .filter(Boolean);
        const daysOverdue = Math.max(0, Math.round((Date.parse(today) - Date.parse(String(b.move_date).slice(0, 10))) / 86_400_000));
        return {
          id: b.id,
          reference: b.reference,
          status: b.status,
          move_date: b.move_date,
          move_time: b.move_time,
          days_overdue: daysOverdue,
          pickup_confirmed: !!b.pickup_confirmed,
          delivery_confirmed: !!b.delivery_confirmed,
          current_journey_leg: b.current_journey_leg,
          stage: b.delivery_confirmed ? "awaiting completion" : b.pickup_confirmed ? "picked up, not delivered" : "not started",
          customer: Array.isArray(b.customer) ? b.customer[0] : b.customer,
          origin: Array.isArray(b.origin) ? b.origin[0] : b.origin,
          destination: Array.isArray(b.destination) ? b.destination[0] : b.destination,
          drivers,
        };
      });

    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
