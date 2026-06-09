import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

/**
 * POST /api/admin/earnings/[id]/pay
 * Mark driver earnings as paid
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Update earning status to paid
    const { data: earning, error } = await supabase
      .from("driver_earnings")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, driver:drivers(first_name, last_name, email), booking:bookings(reference)")
      .single();

    if (error) {
      console.error("Mark paid error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to mark as paid" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: earning.booking_id,
      action: `Earnings paid: £${earning.total_earnings.toFixed(2)} to ${earning.driver?.first_name} ${earning.driver?.last_name}`,
      metadata: { earning_id: id },
    });

    // Send payment confirmation email to driver
    if (earning.driver?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
          to: earning.driver.email,
          subject: `✅ Payment Sent: £${earning.total_earnings.toFixed(2)}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Payment Sent!</h2>
              <p>Hi ${earning.driver.first_name},</p>
              <p>Your earnings have been marked as paid. The payment is on its way to you.</p>

              <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2563eb;">£${earning.total_earnings.toFixed(2)}</p>
                <p style="margin: 8px 0 0 0; color: #1d4ed8;">Paid for booking ${earning.booking?.reference || "N/A"}</p>
              </div>

              <p>You can view your full earnings history in the Driver Portal.</p>

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
        console.error("Failed to send payment email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      earning,
    });
  } catch (error) {
    console.error("POST pay earnings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
