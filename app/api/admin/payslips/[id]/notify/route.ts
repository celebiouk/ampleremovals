/**
 * POST /api/admin/payslips/[id]/notify — send payment notification to worker
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Fetch payslip + worker details
    const { data: payslip, error: psError } = await supabase
      .from("payslips")
      .select(
        `
        id,
        net_pay,
        status,
        paid_at,
        worker_type,
        worker_id,
        pay_runs(reference)
      `
      )
      .eq("id", params.id)
      .single();

    if (psError || !payslip) {
      throw new Error(`Payslip not found: ${psError?.message}`);
    }

    // Only send if paid
    if (payslip.status !== "paid") {
      return NextResponse.json({
        success: false,
        error: "Payslip is not marked as paid",
      });
    }

    // Get worker details
    const tableName = payslip.worker_type === "driver" ? "drivers" : "cleaners";
    const { data: worker, error: wError } = await supabase
      .from(tableName)
      .select("id, first_name, last_name, email, notifications_email")
      .eq("id", payslip.worker_id)
      .single();

    if (wError || !worker) {
      throw new Error(`Worker not found: ${wError?.message}`);
    }

    // Check if worker wants email notifications
    if (!worker.notifications_email) {
      return NextResponse.json({
        success: true,
        notified: false,
        reason: "Worker has disabled email notifications",
      });
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "payroll@ampleremove.com",
      to: worker.email,
      subject: `Your payslip is ready - ${(payslip.pay_runs as any)?.reference}`,
      html: `
        <h2>Your Payslip is Ready</h2>
        <p>Hi ${worker.first_name},</p>
        <p>Your payslip for <strong>${(payslip.pay_runs as any)?.reference}</strong> has been processed and is ready.</p>
        <p><strong>Amount:</strong> £${(payslip.net_pay / 100).toFixed(2)}</p>
        <p>You can view and download your payslip by logging into your account.</p>
        <p>If you have any questions about your payslip, please contact us.</p>
        <p>Best regards,<br/>Ample Removals Payroll Team</p>
      `,
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Log notification
    await supabase.from("activity_log").insert({
      booking_id: null,
      action: "Payslip payment notification sent",
      metadata: {
        payslip_id: params.id,
        worker_id: payslip.worker_id,
        worker_type: payslip.worker_type,
        notification_type: "email",
      },
      performed_by: "admin",
    });

    return NextResponse.json({
      success: true,
      notified: true,
      email: worker.email,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
