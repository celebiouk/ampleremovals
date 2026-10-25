/**
 * GET /api/admin/job-completions — assignments a worker has marked done that
 * admin hasn't confirmed yet (the queue that gates their pay). Shown on the
 * Approvals page alongside extras/expenses/leave.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const status = req.nextUrl.searchParams.get("status") ?? "awaiting";
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("booking_driver_assignments")
    .select(`
      id, booking_id, role, completion_marked_at, completion_confirmed_at, flat_pay_amount,
      driver:drivers(first_name, last_name, preferred_name),
      booking:bookings(reference, customer:customers(full_name)),
      earning:driver_earnings(total_earnings)
    `)
    .not("completion_marked_at", "is", null)
    .order("completion_marked_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Filtered in JS rather than chained conditionally onto the query builder —
  // the conditional-reassignment pattern blows up Supabase's generated query
  // type (TS2589) on a select this nested.
  const rows = (data ?? []).filter((r) =>
    status === "confirmed" ? r.completion_confirmed_at != null : r.completion_confirmed_at == null
  );

  return NextResponse.json({ success: true, completions: rows });
}
