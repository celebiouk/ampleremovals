/**
 * GET /api/worker/payslips/[id] — get payslip detail for authenticated worker
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Determine if user is a driver or cleaner
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!driver && !cleaner) {
      return NextResponse.json(
        { success: false, error: "Not a driver or cleaner" },
        { status: 403 }
      );
    }

    const workerId = driver?.id || cleaner?.id;
    const workerType = driver ? "driver" : "cleaner";

    // Get the specific payslip (ensuring it belongs to this worker)
    const { data: payslip, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        pay_run_id,
        worker_type,
        worker_id,
        gross_earnings,
        tips_total,
        adjustments_total,
        net_pay,
        status,
        paid_at,
        payment_method,
        created_at,
        pay_runs(reference, period_start, period_end),
        payroll_adjustments(type, label, amount)
      `
      )
      .eq("id", params.id)
      .eq("worker_type", workerType)
      .eq("worker_id", workerId)
      .single();

    if (error || !payslip) {
      return NextResponse.json(
        { success: false, error: "Payslip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payslip,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
