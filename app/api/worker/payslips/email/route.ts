/**
 * POST /api/worker/payslips/[id]/email — email payslip to worker
 * GET /api/worker/payslips/email-history — get email delivery history
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Get worker info
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, email")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id, email")
      .eq("user_id", userId)
      .single();

    if (!driver && !cleaner) {
      return NextResponse.json({ success: false, error: "Not a driver or cleaner" }, { status: 403 });
    }

    const worker = driver || cleaner;
    const workerType = driver ? "driver" : "cleaner";

    // Get email delivery history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: history, error } = await supabase
      .from("activity_log")
      .select("*")
      .ilike("action", "%payslip%email%")
      .eq("metadata->worker_type", workerType)
      .eq("metadata->worker_id", worker.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch email history: ${error.message}`);
    }

    // Format history
    const emailHistory = history?.map((h) => ({
      id: h.id,
      date: h.created_at,
      payslip_reference: h.metadata?.payslip_reference || "Unknown",
      status: "sent",
    })) || [];

    return NextResponse.json({
      success: true,
      email_history: {
        total_emails_sent: emailHistory.length,
        emails: emailHistory,
        worker_email: worker.email,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { payslip_id } = body;

    if (!payslip_id) {
      return NextResponse.json(
        { success: false, error: "payslip_id required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get worker info
    const { data: driver } = await supabase
      .from("drivers")
      .select("id, email, first_name")
      .eq("user_id", userId)
      .single();

    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id, email, first_name")
      .eq("user_id", userId)
      .single();

    if (!driver && !cleaner) {
      return NextResponse.json({ success: false, error: "Not a driver or cleaner" }, { status: 403 });
    }

    const worker = driver || cleaner;
    const workerType = driver ? "driver" : "cleaner";

    // Get payslip details
    const { data: payslip, error: payslipError } = await supabase
      .from("payslips")
      .select(
        `
        id,
        gross_earnings,
        tips_total,
        net_pay,
        pay_runs(reference)
      `
      )
      .eq("id", payslip_id)
      .eq("worker_type", workerType)
      .eq("worker_id", worker.id)
      .single();

    if (payslipError || !payslip) {
      return NextResponse.json(
        { success: false, error: "Payslip not found" },
        { status: 404 }
      );
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "payroll@ampleremove.com",
      to: worker.email,
      subject: `Your Payslip - ${payslip.pay_runs.reference}`,
      html: `
        <h2>Your Payslip</h2>
        <p>Hi ${worker.first_name},</p>
        <p>Your payslip for <strong>${payslip.pay_runs.reference}</strong> is attached.</p>
        <p><strong>Summary:</strong></p>
        <ul>
          <li>Gross: £${(payslip.gross_earnings / 100).toFixed(2)}</li>
          <li>Tips: £${(payslip.tips_total / 100).toFixed(2)}</li>
          <li>Net: £${(payslip.net_pay / 100).toFixed(2)}</li>
        </ul>
        <p>Log in to your account to view the full payslip.</p>
      `,
    });

    if (emailError) {
      console.error("Email send failed:", emailError);
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Log to activity log
    await supabase.from("activity_log").insert({
      booking_id: null,
      action: "Payslip emailed to worker",
      metadata: {
        payslip_id,
        payslip_reference: payslip.pay_runs.reference,
        worker_type: workerType,
        worker_id: worker.id,
        email: worker.email,
      },
      performed_by: "worker",
    });

    return NextResponse.json({
      success: true,
      message: `Payslip sent to ${worker.email}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
