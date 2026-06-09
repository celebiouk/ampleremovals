import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendAdminEmails } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";

const ADMIN_PHONE = "07344683477";

/**
 * POST /api/referral/track
 * Creates a referral tracking record when someone books with a referral code
 * Called after booking is created
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referralCode, bookingId, customerId } = body;

    if (!referralCode || !bookingId || !customerId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find referrer
    const { data: referrer, error: referrerError } = await supabase
      .from("customers")
      .select("id, full_name, email, phone")
      .eq("referral_code", referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code" },
        { status: 404 }
      );
    }

    // Get referee details
    const { data: referee } = await supabase
      .from("customers")
      .select("full_name, email, phone")
      .eq("id", customerId)
      .single();

    // Get booking details
    const { data: booking } = await supabase
      .from("bookings")
      .select("reference, service_type")
      .eq("id", bookingId)
      .single();

    // Create referral record
    const { error: insertError } = await supabase.from("referrals").insert({
      referrer_customer_id: referrer.id,
      referee_customer_id: customerId,
      referral_code: referralCode.toUpperCase(),
      referee_name: referee?.full_name,
      referee_email: referee?.email,
      referee_phone: referee?.phone,
      referee_booking_id: bookingId,
      status: "pending",
      referrer_reward_amount: 20.00,
      referee_reward_amount: 20.00,
    });

    if (insertError) {
      console.error("Create referral error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create referral" },
        { status: 500 }
      );
    }

    // Update customer with referral code they used
    await supabase
      .from("customers")
      .update({ referred_by_code: referralCode.toUpperCase() })
      .eq("id", customerId);

    // Notify admin
    const adminEmailSubject = `🎉 New Referral: ${referrer.full_name} referred ${referee?.full_name}`;
    const adminEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 New Referral!</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b; margin-bottom: 16px;">
            <strong>${referrer.full_name}</strong> successfully referred <strong>${referee?.full_name}</strong>!
          </p>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #15803d;">Referrer Details:</p>
            <p style="margin: 4px 0; color: #166534;">
              <strong>Name:</strong> ${referrer.full_name}<br>
              <strong>Email:</strong> ${referrer.email}<br>
              <strong>Phone:</strong> ${referrer.phone}<br>
              <strong>Code:</strong> ${referralCode.toUpperCase()}
            </p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af;">Referee Details:</p>
            <p style="margin: 4px 0; color: #1e3a8a;">
              <strong>Name:</strong> ${referee?.full_name}<br>
              <strong>Email:</strong> ${referee?.email}<br>
              <strong>Phone:</strong> ${referee?.phone}<br>
              <strong>Booking:</strong> ${booking?.reference}
            </p>
          </div>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #78350f;">
              💰 <strong>Rewards:</strong><br>
              • Referee gets £20 off this booking<br>
              • Referrer will get £20 credit when job completes
            </p>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
            Status: Pending (will complete when job finishes)
          </p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "bookings@ampleremovals.com",
        to: resendAdminEmails,
        subject: adminEmailSubject,
        html: adminEmailBody,
      });
    } catch (emailErr) {
      console.error("Admin notification failed:", emailErr);
    }

    // SMS to admin
    try {
      await sendSMS(
        ADMIN_PHONE,
        `🎉 NEW REFERRAL!\n\n${referrer.full_name} referred ${referee?.full_name}\n\nBooking: ${booking?.reference}\nCode: ${referralCode.toUpperCase()}\n\n£20 rewards pending!`
      );
    } catch (smsErr) {
      console.error("Admin SMS failed:", smsErr);
    }

    // WhatsApp to admin
    try {
      await sendWhatsApp(
        ADMIN_PHONE,
        `🎉 *NEW REFERRAL!*\n\n*Referrer:* ${referrer.full_name}\n*Referee:* ${referee?.full_name}\n\n*Booking:* ${booking?.reference}\n*Code:* ${referralCode.toUpperCase()}\n\n💰 £20 rewards pending completion!`
      );
    } catch (whatsappErr) {
      console.error("Admin WhatsApp failed:", whatsappErr);
    }

    return NextResponse.json({
      success: true,
      message: "Referral tracked successfully",
    });
  } catch (error) {
    console.error("Referral track error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
