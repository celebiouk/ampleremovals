/**
 * PATCH /api/admin/payslips/bulk — bulk operations on payslips
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { payslip_ids, action, data } = body;

    if (!payslip_ids || !Array.isArray(payslip_ids) || payslip_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "payslip_ids required and must be non-empty array" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (action === "mark_paid") {
      // Mark multiple payslips as paid
      const { error } = await supabase
        .from("payslips")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .in("id", payslip_ids);

      if (error) {
        throw new Error(`Failed to mark payslips paid: ${error.message}`);
      }

      // Log to activity log
      await supabase.from("activity_log").insert({
        booking_id: null,
        action: `Bulk marked ${payslip_ids.length} payslips as paid`,
        metadata: { payslip_ids, action: "mark_paid" },
        performed_by: "admin",
      });

      return NextResponse.json({
        success: true,
        action: "mark_paid",
        count: payslip_ids.length,
        message: `Marked ${payslip_ids.length} payslips as paid`,
      });
    } else if (action === "send_notifications") {
      // Queue notifications for payslips
      // (In production, would queue to a job system or call Resend/Twilio in bulk)

      await supabase.from("activity_log").insert({
        booking_id: null,
        action: `Queued notifications for ${payslip_ids.length} payslips`,
        metadata: { payslip_ids, action: "send_notifications" },
        performed_by: "admin",
      });

      return NextResponse.json({
        success: true,
        action: "send_notifications",
        count: payslip_ids.length,
        message: `Queued notifications for ${payslip_ids.length} payslips`,
      });
    } else if (action === "add_adjustment") {
      // Add same adjustment to multiple payslips
      const { amount, type, description } = data;

      if (!amount || !type || !description) {
        return NextResponse.json(
          { success: false, error: "amount, type, description required" },
          { status: 400 }
        );
      }

      const adjustments = payslip_ids.map((payslip_id: string) => ({
        payslip_id,
        type,
        amount,
        description,
      }));

      const { error } = await supabase
        .from("payroll_adjustments")
        .insert(adjustments);

      if (error) {
        throw new Error(`Failed to add adjustments: ${error.message}`);
      }

      await supabase.from("activity_log").insert({
        booking_id: null,
        action: `Added ${type} adjustment (${formatCurrency(amount)}) to ${payslip_ids.length} payslips`,
        metadata: { payslip_ids, adjustment: data },
        performed_by: "admin",
      });

      return NextResponse.json({
        success: true,
        action: "add_adjustment",
        count: payslip_ids.length,
        message: `Added ${type} adjustment to ${payslip_ids.length} payslips`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return `£${(amount / 100).toFixed(2)}`;
}
