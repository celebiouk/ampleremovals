/**
 * Payroll logic — pay run generation, idempotency, notifications.
 * Respects the decided business rules:
 * - Only approved earnings enter a run
 * - Grouped by paid_date
 * - Email notification when payslip marked paid
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface PayRunInput {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
}

export interface PayslipWithEarnings {
  payslipId: string;
  workerId: string;
  workerType: string;
  grossEarnings: number;
  tipsTotal: number;
  adjustmentsTotal: number;
  netPay: number;
  jobsCount: number;
  earningIds: string[];
}

/**
 * Generate a pay run for a period.
 * - Find all approved earnings with paid_date in [periodStart, periodEnd]
 * - Not already on another payslip (idempotency via UNIQUE on earning_id)
 * - Group by worker_type + worker_id
 * - Create one payslip per worker
 * - Return the run with payslips
 */
export async function generatePayRun(input: PayRunInput) {
  const supabase = createAdminClient();

  // 1. Generate reference
  const { data: reference } = await supabase.rpc("generate_pay_run_reference");

  // 2. Create the run
  const { data: payRun, error: runError } = await supabase
    .from("pay_runs")
    .insert({
      reference,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      status: "draft",
    })
    .select("id")
    .single();

  if (runError || !payRun) {
    throw new Error(`Failed to create pay run: ${runError?.message}`);
  }

  // 3. Fetch approved earnings in the period (paid_date basis)
  const { data: earnings, error: earningsError } = await supabase
    .from("driver_earnings")
    .select("id, driver_id, gross_earnings, tip_amount, booking_total")
    .eq("status", "approved")
    .gte("paid_at", input.periodStart)
    .lte("paid_at", input.periodEnd);

  if (earningsError) {
    throw new Error(`Failed to fetch earnings: ${earningsError.message}`);
  }

  // Filter out earnings already on a payslip
  const { data: usedEarnings } = await supabase
    .from("payslip_earnings")
    .select("earning_id");

  const usedIds = new Set((usedEarnings || []).map((ue) => ue.earning_id));
  const availableEarnings = (earnings || []).filter((e) => !usedIds.has(e.id));

  // 4. Group earnings by driver_id
  const grouped: Record<
    string,
    {
      earnings: (typeof availableEarnings)[0][];
      gross: number;
      tips: number;
      count: number;
    }
  > = {};

  for (const e of availableEarnings) {
    const key = e.driver_id;
    if (!grouped[key]) {
      grouped[key] = { earnings: [], gross: 0, tips: 0, count: 0 };
    }
    const g = grouped[key];
    g.earnings.push(e);
    g.gross += e.gross_earnings || 0;
    g.tips += e.tip_amount || 0;
    g.count += 1;
  }

  // 5. Create payslips + payslip_earnings
  const payslips: PayslipWithEarnings[] = [];

  for (const driverId in grouped) {
    const summary = grouped[driverId];
    const { data: payslip, error: psError } = await supabase
      .from("payslips")
      .insert({
        pay_run_id: payRun.id,
        worker_type: "driver",
        worker_id: driverId,
        gross_earnings: summary.gross,
        tips_total: summary.tips,
        adjustments_total: 0,
        net_pay: summary.gross + summary.tips, // no adjustments yet
        jobs_count: summary.count,
      })
      .select("id")
      .single();

    if (psError || !payslip) {
      throw new Error(
        `Failed to create payslip for ${driverId}: ${psError?.message}`
      );
    }

    // Link earnings to payslip
    const earningIds = summary.earnings.map((e) => e.id);
    const { error: linkError } = await supabase
      .from("payslip_earnings")
      .insert(earningIds.map((eid) => ({ payslip_id: payslip.id, earning_id: eid })));

    if (linkError) {
      throw new Error(
        `Failed to link earnings for ${driverId}: ${linkError.message}`
      );
    }

    payslips.push({
      payslipId: payslip.id,
      workerId: driverId,
      workerType: "driver",
      grossEarnings: summary.gross,
      tipsTotal: summary.tips,
      adjustmentsTotal: 0,
      netPay: summary.gross + summary.tips,
      jobsCount: summary.count,
      earningIds,
    });
  }

  return { runId: payRun.id, reference, payslips };
}

/**
 * Mark a payslip as paid.
 * - Update payslip status + paid_at + payment_method
 * - Update all linked earnings to paid + paid_at
 * - Write activity_log entry
 * - Trigger email notification to the worker (optional, per business rules)
 */
export async function markPayslipPaid(
  payslipId: string,
  paymentMethod: string
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Get the payslip + worker info
  const { data: payslip, error: psError } = await supabase
    .from("payslips")
    .select("id, pay_run_id, worker_id, worker_type, net_pay")
    .eq("id", payslipId)
    .single();

  if (psError || !payslip) {
    throw new Error(`Failed to fetch payslip: ${psError?.message}`);
  }

  // 2. Get all linked earnings
  const { data: links, error: linkError } = await supabase
    .from("payslip_earnings")
    .select("earning_id")
    .eq("payslip_id", payslipId);

  if (linkError) {
    throw new Error(`Failed to fetch linked earnings: ${linkError.message}`);
  }

  const earningIds = links?.map((l) => l.earning_id) || [];

  // 3. Update payslip
  const { error: updateError } = await supabase
    .from("payslips")
    .update({
      status: "paid",
      paid_at: now,
      payment_method: paymentMethod,
    })
    .eq("id", payslipId);

  if (updateError) {
    throw new Error(`Failed to update payslip: ${updateError.message}`);
  }

  // 4. Update linked earnings
  if (earningIds.length > 0) {
    const { error: earnError } = await supabase
      .from("driver_earnings")
      .update({ status: "paid", paid_at: now })
      .in("id", earningIds);

    if (earnError) {
      throw new Error(
        `Failed to update earnings to paid: ${earnError.message}`
      );
    }
  }

  // 5. Write activity log
  await supabase.from("activity_log").insert({
    booking_id: null,
    action: "Payslip marked paid",
    metadata: {
      payslip_id: payslipId,
      worker_id: payslip.worker_id,
      worker_type: payslip.worker_type,
      amount: payslip.net_pay,
      payment_method: paymentMethod,
      earning_count: earningIds.length,
    },
    performed_by: "admin",
  });

  // 6. TODO: Trigger email notification (when notification endpoints built)
  // For now, just log that we should notify
  console.log(
    `[Payroll] Payslip ${payslipId} marked paid — email should be sent to worker ${payslip.worker_id}`
  );

  return { success: true, payslipId, paid_at: now };
}

/**
 * Mark all payslips in a run as paid.
 */
export async function markPayRunPaid(payRunId: string, paymentMethod: string) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Get all payslips in the run
  const { data: payslips, error: psError } = await supabase
    .from("payslips")
    .select("id")
    .eq("pay_run_id", payRunId);

  if (psError) {
    throw new Error(`Failed to fetch payslips: ${psError.message}`);
  }

  // Mark each as paid
  for (const ps of payslips || []) {
    await markPayslipPaid(ps.id, paymentMethod);
  }

  // Mark the run as paid
  await supabase
    .from("pay_runs")
    .update({ status: "paid", paid_at: now })
    .eq("id", payRunId);

  return { success: true, payRunId, payslipsCount: payslips?.length || 0 };
}
