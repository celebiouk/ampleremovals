import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Resend } from "resend";

/**
 * GET /api/admin/drivers/[id]
 * Fetch single driver details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = params;
    const supabase = createAdminClient();

    // Fetch driver
    const { data: driver, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    // Get job count
    const { count: jobCount } = await supabase
      .from("booking_driver_assignments")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", id);

    // Get earnings summary
    const { data: earnings } = await supabase
      .from("driver_earnings")
      .select("total_earnings, status")
      .eq("driver_id", id);

    const earningsSummary = {
      total: earnings?.reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
      pending: earnings?.filter((e) => e.status === "pending").reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
      approved: earnings?.filter((e) => e.status === "approved").reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
      paid: earnings?.filter((e) => e.status === "paid").reduce((sum, e) => sum + (e.total_earnings || 0), 0) || 0,
    };

    // Customer ratings for this driver's jobs (the booking survey is the rating
    // for whoever did the job).
    const { data: assigns } = await supabase
      .from("booking_driver_assignments")
      .select("booking_id")
      .eq("driver_id", id);
    const bookingIds = (assigns ?? []).map((a) => a.booking_id);
    let ratingsSummary = { average: null as number | null, count: 0, recent: [] as { reference: string; rating: number; feedback: string | null; customerName: string; date: string | null }[] };
    if (bookingIds.length > 0) {
      const { data: rated } = await supabase
        .from("bookings")
        .select("reference, move_date, survey_rating, survey_feedback, survey_completed_at, customer:customers(full_name)")
        .in("id", bookingIds)
        .not("survey_rating", "is", null)
        .order("survey_completed_at", { ascending: false });
      const list = rated ?? [];
      const count = list.length;
      const average = count > 0 ? Math.round((list.reduce((s, b) => s + (b.survey_rating || 0), 0) / count) * 10) / 10 : null;
      ratingsSummary = {
        average,
        count,
        recent: list.slice(0, 10).map((b) => {
          const c = Array.isArray(b.customer) ? b.customer[0] : b.customer;
          return { reference: b.reference, rating: b.survey_rating as number, feedback: (b.survey_feedback as string | null) ?? null, customerName: c?.full_name ?? "Customer", date: b.move_date };
        }),
      };
    }

    return NextResponse.json({
      success: true,
      driver: {
        ...driver,
        job_count: jobCount || 0,
        earnings_summary: earningsSummary,
        ratings: ratingsSummary,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/drivers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/drivers/[id]
 * Update driver details
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = params;
    const body = await req.json();

    const supabase = createAdminClient();

    // Get driver before update to check if status changed
    const { data: oldDriver } = await supabase
      .from("drivers")
      .select("status, default_pay_percentage, email, first_name")
      .eq("id", id)
      .single();

    // Update driver
    const { data: driver, error } = await supabase
      .from("drivers")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update driver error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update driver" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      action: `Driver updated: ${driver.first_name} ${driver.last_name}`,
      metadata: { driver_id: id },
      performed_by: "admin",
    });

    // If driver was approved (status changed to active from inactive with 0% pay)
    const wasApproved =
      oldDriver?.status === "inactive" &&
      oldDriver?.default_pay_percentage === 0 &&
      driver.status === "active" &&
      driver.default_pay_percentage > 0;

    if (wasApproved) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
          to: driver.email,
          subject: "🎉 Your Driver Application Has Been Approved!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Congratulations ${driver.first_name}!</h2>
              <p>Your driver application has been approved. Welcome to the Ample Removals team!</p>

              <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
                <p style="margin: 0;"><strong>✅ Your account is now active!</strong></p>
                <p style="margin: 8px 0 0 0;">You can start logging in and accepting jobs immediately.</p>
              </div>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Account Details:</h3>
                <p><strong>Status:</strong> Active ✅</p>
                <p><strong>Default Pay Rate:</strong> ${driver.default_pay_percentage}%</p>
                <p><strong>Login Email:</strong> ${driver.email}</p>
              </div>

              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Log in to the Driver Portal</li>
                <li>Complete your profile</li>
                <li>Check for assigned jobs</li>
                <li>Start earning!</li>
              </ol>

              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/drivers/login"
                 style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
                Log In to Driver Portal
              </a>

              <p style="margin-top: 30px;">
                If you have any questions, please reply to this email or contact your supervisor.
              </p>

              <p style="margin-top: 30px;">
                Welcome aboard!<br>
                <strong>Ample Removals Team</strong>
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("PATCH /api/admin/drivers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
