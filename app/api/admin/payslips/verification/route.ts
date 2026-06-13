/**
 * GET /api/admin/payslips/verification — payment verification & audit trail
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get all paid payslips with verification data
    const { data: payslips, error } = await supabase
      .from("payslips")
      .select(
        `
        id,
        worker_type,
        worker_id,
        net_pay,
        payment_method,
        paid_at,
        created_at,
        pay_runs(reference, period_start, period_end)
      `
      )
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Failed to fetch payslips: ${error.message}`);
    }

    // Get activity log for payment confirmations
    const { data: activities, error: actError } = await supabase
      .from("activity_log")
      .select("*")
      .ilike("action", "%payment%")
      .order("created_at", { ascending: false })
      .limit(50);

    if (actError) {
      throw new Error(`Failed to fetch activity log: ${actError.message}`);
    }

    // Calculate verification stats
    const totalPaid = payslips?.reduce((sum, p) => sum + p.net_pay, 0) || 0;
    const paymentMethods = payslips?.reduce(
      (acc: Record<string, number>, p: any) => {
        const method = p.payment_method || "unknown";
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      },
      {}
    ) || {};

    // Group by payment method for verification
    const verificationByMethod = Object.entries(paymentMethods).map(
      ([method, count]) => {
        const payslipsForMethod = payslips?.filter(
          (p) => (p.payment_method || "unknown") === method
        ) || [];
        const totalForMethod = payslipsForMethod.reduce((sum, p) => sum + p.net_pay, 0);

        return {
          method,
          count,
          total: totalForMethod,
          avg: totalForMethod / (count as number),
        };
      }
    );

    return NextResponse.json({
      success: true,
      verification: {
        total_paid: totalPaid,
        total_payslips: payslips?.length || 0,
        payment_methods: verificationByMethod,
        recent_payments: payslips,
        audit_log: activities,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
