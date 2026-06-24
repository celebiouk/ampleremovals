/**
 * /api/admin/leave-requests — list driver leave requests (GET, ?status=pending
 * default) and approve/reject them (PATCH { id, status }).
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const supabase = createAdminClient();
  let q = supabase.from("driver_leave_requests").select("*, driver:drivers(first_name, last_name, preferred_name)").order("start_date", { ascending: false }).limit(300);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return NextResponse.json({ success: true, requests: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => null) as { id?: string; status?: string } | null;
  if (!b?.id || !["approved", "rejected"].includes(b.status ?? "")) {
    return NextResponse.json({ success: false, error: "id and status (approved|rejected) required" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("driver_leave_requests").update({ status: b.status, reviewed_at: new Date().toISOString() }).eq("id", b.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
