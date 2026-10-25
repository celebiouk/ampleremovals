/**
 * GET /api/admin/drivers/[id]/jobs — every booking a driver or porter has ever
 * been assigned to, split into upcoming and past. Used by the driver profile
 * page (web) and the native admin app's driver detail screen.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface AssignmentRow {
  id: string;
  role: string | null;
  acceptance_status: string | null;
  flat_pay_amount: number | null;
  booking: {
    id: string;
    reference: string;
    service_type: string;
    status: string;
    move_date: string | null;
    is_flexible_date: boolean | null;
    flexible_date_from: string | null;
    flexible_date_to: string | null;
    customer: { full_name: string } | { full_name: string }[] | null;
  } | null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_driver_assignments")
    .select(`
      id, role, acceptance_status, flat_pay_amount,
      booking:bookings!inner(
        id, reference, service_type, status, move_date, is_flexible_date, flexible_date_from, flexible_date_to,
        customer:customers(full_name)
      )
    `)
    .eq("driver_id", params.id)
    .order("assigned_at", { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const todayISO = new Date().toISOString().slice(0, 10);
  const rows = (data ?? []) as unknown as AssignmentRow[];

  const jobs = rows
    .filter((r) => r.booking)
    .map((r) => {
      const b = r.booking!;
      const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
      // A flexible-date booking sorts/splits by the END of its window; a fixed
      // date uses move_date directly. No date at all (not yet scheduled) counts
      // as upcoming — it hasn't happened, so it can't be "past".
      const effectiveDate = b.is_flexible_date ? b.flexible_date_from : b.move_date;
      const isPast = !!effectiveDate && effectiveDate < todayISO;
      return {
        assignmentId: r.id,
        bookingId: b.id,
        reference: b.reference,
        serviceType: b.service_type,
        status: b.status,
        moveDate: b.move_date,
        isFlexibleDate: !!b.is_flexible_date,
        flexibleDateFrom: b.flexible_date_from,
        flexibleDateTo: b.flexible_date_to,
        customerName: customer?.full_name ?? "Customer",
        role: r.role ?? "driver",
        acceptanceStatus: r.acceptance_status,
        flatPayAmount: r.flat_pay_amount,
        isPast,
      };
    });

  const upcoming = jobs.filter((j) => !j.isPast).sort((a, b) => (a.moveDate ?? "9999").localeCompare(b.moveDate ?? "9999"));
  const past = jobs.filter((j) => j.isPast).sort((a, b) => (b.moveDate ?? "").localeCompare(a.moveDate ?? ""));

  return NextResponse.json({ success: true, upcoming, past });
}
