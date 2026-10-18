/**
 * /api/admin/job-extras — list driver-added extra charges (GET, ?status=pending by
 * default) and approve/reject them (PATCH { id, status }).
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { createAndSendExtraCharge } from "@/lib/bookings/extraCharge";
import { logError } from "@/lib/log-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const supabase = createAdminClient();
  let q = supabase.from("job_extras").select("*, booking:bookings(reference), driver:drivers(first_name, preferred_name)").order("created_at", { ascending: false }).limit(300);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return NextResponse.json({ success: true, extras: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const b = await req.json().catch(() => null) as { id?: string; status?: string } | null;
  if (!b?.id || !["approved", "rejected"].includes(b.status ?? "")) {
    return NextResponse.json({ success: false, error: "id and status (approved|rejected) required" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("job_extras").update({ status: b.status, reviewed_at: new Date().toISOString() }).eq("id", b.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (b.status === "approved") {
    try {
      const result = await createAndSendExtraCharge(supabase, b.id);
      return NextResponse.json({ success: true, invoice: result });
    } catch (err) {
      // The approval itself already succeeded — don't tell the admin it failed,
      // just flag that invoicing/sending needs a retry.
      await logError({ message: `Extra-charge invoice/send failed after approval: ${err instanceof Error ? err.message : String(err)}`, metadata: { jobExtraId: b.id } });
      return NextResponse.json({ success: true, invoiced: false, error: "Approved, but creating/sending the invoice failed — check it manually" });
    }
  }

  return NextResponse.json({ success: true });
}
