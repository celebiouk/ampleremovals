import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

/**
 * POST /api/admin/earnings/[id]/approve
 * Approve driver earnings
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Update earning status to approved
    const { data: earning, error } = await supabase
      .from("driver_earnings")
      .update({ status: "approved" })
      .eq("id", id)
      .select("*, driver:drivers(first_name, last_name, email, phone), booking:bookings(reference)")
      .single();

    if (error) {
      console.error("Approve earnings error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to approve earnings" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: earning.booking_id,
      action: `Earnings approved: £${earning.total_earnings.toFixed(2)} for ${earning.driver?.first_name} ${earning.driver?.last_name}`,
      metadata: { earning_id: id },
      performed_by: "admin",
    });

    // Send notification email to driver about approved earnings
    if (earning.driver?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
          to: earning.driver.email,
          subject: `💰 Earnings Approved: £${earning.total_earnings.toFixed(2)}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Earnings Approved!</h2>
              <p>Hi ${earning.driver.first_name},</p>
              <p>Good news — your earnings for a completed job have been approved.</p>

              <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16a34a;">£${earning.total_earnings.toFixed(2)}</p>
                <p style="margin: 8px 0 0 0; color: #15803d;">Approved and awaiting payment</p>
              </div>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Breakdown:</h3>
                <p><strong>Booking:</strong> ${earning.booking?.reference || "N/A"}</p>
                <p><strong>Base Earnings (${earning.pay_percentage}%):</strong> £${earning.gross_earnings.toFixed(2)}</p>
                <p><strong>Tips:</strong> £${earning.tip_amount.toFixed(2)}</p>
                <p style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;"><strong>Total:</strong> £${earning.total_earnings.toFixed(2)}</p>
              </div>

              <p>You can view all your earnings in the Driver Portal.</p>

              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/drivers/earnings"
                 style="display: inline-block; background: #6b21a8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 12px;">
                View My Earnings
              </a>

              <p style="margin-top: 30px;">
                Thanks for your hard work!<br>
                <strong>Ample Removals Team</strong>
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send earnings approval email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      earning,
    });
  } catch (error) {
    console.error("POST approve earnings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
