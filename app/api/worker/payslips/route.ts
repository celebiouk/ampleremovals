/**
 * GET /api/worker/payslips — list all payslips for authenticated worker
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
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

    // Get all payslips for this worker
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        pay_run_id,
        gross_earnings,
        tips_total,
        adjustments_total,
        net_pay,
        status,
        paid_at,
        created_at,
        pay_runs(reference, period_start, period_end)
      `
      )
      .eq("worker_type", workerType)
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Calculate totals
    const totals = {
      paid: payslips
        ?.filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.net_pay, 0) || 0,
      pending: payslips
        ?.filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.net_pay, 0) || 0,
      total: payslips?.reduce((sum, p) => sum + p.net_pay, 0) || 0,
    };

    return NextResponse.json({
      success: true,
      payslips: payslips || [],
      totals,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
