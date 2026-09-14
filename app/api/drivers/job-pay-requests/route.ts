/**
 * POST /api/drivers/job-pay-requests — a driver/porter did work with no
 * assignment already in the system; submit for admin approval + pay amount.
 * GET  — the signed-in driver's own requests (for the driver-app screen).
 */
import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/driver-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAdminPush } from "@/lib/push-dispatch";

export async function POST(req: Request) {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  try {
    const { workDate, description } = await req.json();
    if (!workDate) return NextResponse.json({ success: false, error: "Work date required" }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ success: false, error: "Describe the job" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: request, error } = await supabase
      .from("job_pay_requests")
      .insert({ driver_id: auth.driver.id, work_date: workDate, description: description.trim() })
      .select("id")
      .single();
    if (error) throw error;

    const name = auth.driver.preferred_name || auth.driver.first_name;
    await sendAdminPush({
      title: "💷 Pay request submitted",
      body: `${name} — ${workDate}: ${description.trim().slice(0, 120)}`,
      data: { jobPayRequestId: request.id },
    }).catch(() => {});

    return NextResponse.json({ success: true, id: request.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireDriver();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { data: requests } = await supabase
    .from("job_pay_requests")
    .select("id, work_date, description, status, approved_amount, created_at")
    .eq("driver_id", auth.driver.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ success: true, requests: requests ?? [] });
}
