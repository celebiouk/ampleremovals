/** GET /api/admin/job-pay-requests — pending (+ recently decided) manual pay requests. */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { data: requests } = await supabase
    .from("job_pay_requests")
    .select("id, work_date, description, status, approved_amount, created_at, decided_at, driver:drivers(id, first_name, last_name, preferred_name, account_type)")
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ success: true, requests: requests ?? [] });
}
