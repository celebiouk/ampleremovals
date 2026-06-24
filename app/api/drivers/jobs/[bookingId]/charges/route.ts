/**
 * /api/drivers/jobs/[bookingId]/charges — driver adds an on-site extra charge to a
 * job (POST, goes to admin as 'pending') or lists this job's extras (GET).
 */
import { NextResponse } from "next/server";
import { requireDriver, driverAssignedTo } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const b = await req.json().catch(() => null) as { description?: string; amount?: number } | null;
    const description = (b?.description ?? "").trim();
    const amount = Number(b?.amount);
    if (!description || !Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ success: false, error: "Description and a valid amount are required" }, { status: 400 });
    }
    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }
    const { data, error } = await supabase.from("job_extras").insert({
      booking_id: params.bookingId, driver_id: auth.driver.id, description, amount, status: "pending",
    }).select("id").single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    await supabase.from("activity_log").insert({
      booking_id: params.bookingId, action: `Driver added extra charge: ${description} (£${amount.toFixed(2)}) — pending approval`,
      metadata: { driver_id: auth.driver.id }, performed_by: "driver",
    });
    return NextResponse.json({ success: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { bookingId: string } }) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const supabase = createAdminClient();
    if (!(await driverAssignedTo(supabase, params.bookingId, auth.driver.id))) {
      return NextResponse.json({ success: false, error: "Not your job" }, { status: 403 });
    }
    const { data } = await supabase.from("job_extras").select("*").eq("booking_id", params.bookingId).order("created_at", { ascending: false });
    return NextResponse.json({ success: true, extras: data ?? [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
