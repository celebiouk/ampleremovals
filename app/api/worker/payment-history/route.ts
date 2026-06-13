/**
 * GET /api/worker/payment-history — get worker's payment history
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

    // Get all paid payslips for this worker
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        net_pay,
        payment_method,
        paid_at,
        pay_runs(reference, period_start, period_end)
      `
      )
      .eq("worker_type", workerType)
      .eq("worker_id", workerId)
      .eq("status", "paid")
      .order("paid_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }

    // Calculate summary
    const totalPaid = payslips?.reduce((sum, p) => sum + p.net_pay, 0) || 0;
    const paymentMethods = payslips?.reduce(
      (acc: Record<string, number>, p: any) => {
        const method = p.payment_method || "bank_transfer";
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      },
      {}
    ) || {};

    return NextResponse.json({
      success: true,
      payment_history: payslips || [],
      summary: {
        total_paid: totalPaid,
        payment_count: payslips?.length || 0,
        payment_methods: paymentMethods,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
