/**
 * GET /api/worker/payments/confirmations — worker payment confirmations & details
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
      .select("id, bank_account_last_four, bank_sort_code")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id, bank_account_last_four, bank_sort_code")
      .eq("user_id", userId)
      .single();

    if (!driver && !cleaner) {
      return NextResponse.json(
        { success: false, error: "Not a driver or cleaner" },
        { status: 403 }
      );
    }

    const worker = driver || cleaner;
    const workerType = driver ? "driver" : "cleaner";
    const workerId = worker.id;

    // Get all paid payslips with payment details
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        net_pay,
        payment_method,
        paid_at,
        created_at,
        pay_runs(reference, period_start, period_end)
      `
      )
      .eq("worker_type", workerType)
      .eq("worker_id", workerId)
      .eq("status", "paid")
      .order("paid_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Format payment confirmations
    const confirmations = payslips?.map((p) => ({
      id: p.id,
      reference: p.pay_runs.reference,
      period_start: p.pay_runs.period_start,
      period_end: p.pay_runs.period_end,
      amount: p.net_pay,
      payment_method: p.payment_method || "bank_transfer",
      paid_date: p.paid_at,
      confirmation_status: "confirmed", // In production, this would check with payment provider
      last_four_digits: worker.bank_account_last_four,
      sort_code: worker.bank_sort_code ? `${worker.bank_sort_code.slice(0, 2)}-${worker.bank_sort_code.slice(2, 4)}-${worker.bank_sort_code.slice(4)}` : null,
    })) || [];

    // Calculate stats
    const totalPaid = confirmations.reduce((sum, c) => sum + c.amount, 0);
    const pendingCount = payslips?.filter(p => !p.paid_at).length || 0;

    return NextResponse.json({
      success: true,
      payment_confirmations: {
        total_payments: confirmations.length,
        total_paid: totalPaid,
        pending_payments: pendingCount,
        bank_details_on_file: !!(worker.bank_account_last_four && worker.bank_sort_code),
        confirmations: confirmations,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
