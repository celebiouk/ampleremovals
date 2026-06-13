/**
 * GET /api/worker/earnings/summary — get earnings summary for authenticated worker
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Determine worker type
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
      .select("gross_earnings, tips_total, net_pay, status, created_at")
      .eq("worker_type", workerType)
      .eq("worker_id", workerId);

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Calculate summary stats
    const summary = {
      total_payslips: payslips?.length || 0,
      total_gross: payslips?.reduce((sum, p) => sum + p.gross_earnings, 0) || 0,
      total_tips: payslips?.reduce((sum, p) => sum + p.tips_total, 0) || 0,
      total_net_paid: payslips
        ?.filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.net_pay, 0) || 0,
      total_net_pending: payslips
        ?.filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.net_pay, 0) || 0,
      average_payslip: payslips && payslips.length > 0
        ? payslips.reduce((sum, p) => sum + p.net_pay, 0) / payslips.length
        : 0,
      recent_payslips: payslips
        ?.slice(-6)
        .reverse()
        .map((p) => ({
          month: new Date(p.created_at).toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          }),
          net_pay: p.net_pay,
        })) || [],
    };

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
