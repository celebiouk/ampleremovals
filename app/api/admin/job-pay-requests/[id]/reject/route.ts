/** POST /api/admin/job-pay-requests/[id]/reject */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_pay_requests")
    .update({ status: "rejected", decided_by: "admin", decided_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ success: false, error: "Request not found or already decided" }, { status: 400 });

  return NextResponse.json({ success: true });
}
