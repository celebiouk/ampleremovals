import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { DEFAULT_GOOGLE_REVIEW_LINK } from "@/lib/constants";

/**
 * POST /api/admin/driver-status
 * Updates driver status and notifies customer
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing booking ID or status" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "on_my_way",
      "20_mins_away",
      "10_mins_away",
      "15_mins_to_delivery",
      "job_completed",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch booking details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        service_type,
        customer:customers!inner(full_name, email, phone),
        origin:addresses!origin_address_id(line_1, line_2, city, postcode),
        destination:addresses!destination_address_id(line_1, line_2, city, postcode)
      `)
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer as { full_name: string; email: string; phone: string };
    const origin = Array.isArray(booking.origin) ? booking.origin[0] : booking.origin as { line_1: string; line_2?: string; city?: string; postcode: string };
    const destination = Array.isArray(booking.destination) ? booking.destination[0] : booking.destination as { line_1: string; line_2?: string; city?: string; postcode: string };

    const formatAddress = (addr: typeof origin) => {
      return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
    };

    const originAddress = formatAddress(origin);
    const destinationAddress = formatAddress(destination);

    // Update booking with status timestamp
    const statusFieldMap: Record<string, string> = {
      on_my_way: "driver_on_way_at",
      "20_mins_away": "driver_20mins_away_at",
      "10_mins_away": "driver_10mins_away_at",
      "15_mins_to_delivery": "driver_15mins_to_delivery_at",
      job_completed: "job_completed_at",
    };

    const updateField = statusFieldMap[status];
    const updateData: Record<string, unknown> = {
      [updateField]: new Date().toISOString(),
    };

    // If job completed, also update status
    if (status === "job_completed") {
      updateData.status = "job_completed";
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    if (updateError) {
      console.error("Update booking error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update status" },
        { status: 500 }
      );
    }

    // Log activity
    const statusLabels: Record<string, string> = {
      on_my_way: "Driver on the way",
      "20_mins_away": "Driver 20 minutes away",
      "10_mins_away": "Driver 10 minutes away",
      "15_mins_to_delivery": "Driver 15 minutes to delivery",
      job_completed: "Job completed",
    };

    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: statusLabels[status],
      metadata: { driver_status: status },
      performed_by: "admin",
    });

    // Send customer notifications based on status
    let emailSubject = "";
    let emailBody = "";
    let smsBody = "";
    let whatsappBody = "";

    if (status === "on_my_way") {
      emailSubject = `🚚 Our Driver is On The Way! - ${booking.reference}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #6b21a8; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚚 Driver On The Way!</h1>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
            <p style="font-size: 16px; color: #1e293b; margin: 20px 0;">
              Great news! Our driver is on the way to your pick-up address:
            </p>
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #15803d; font-weight: bold;">📍 ${originAddress}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">We'll keep you updated as we get closer!</p>
          </div>
        </div>
      `;
      smsBody = `🚚 Our driver is on the way to ${originAddress}! We'll update you as we get closer. - ${booking.reference}`;
      whatsappBody = `🚚 *Driver On The Way!*\n\nHi ${customer.full_name},\n\nOur driver is heading to your pick-up address:\n📍 ${originAddress}\n\nWe'll keep you updated!\n\nBooking: ${booking.reference}`;
    } else if (status === "20_mins_away") {
      emailSubject = `⏰ Driver Arriving in 20 Minutes! - ${booking.reference}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Driver 20 Minutes Away!</h1>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
            <p style="font-size: 18px; color: #92400e; font-weight: bold; margin: 20px 0;">
              Our driver will arrive in approximately 20 minutes!
            </p>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #78350f;">📍 ${originAddress}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Please ensure everything is ready for loading. See you soon!</p>
          </div>
        </div>
      `;
      smsBody = `⏰ Our driver will arrive in 20 minutes at ${originAddress}! Please be ready. - ${booking.reference}`;
      whatsappBody = `⏰ *Driver 20 Minutes Away!*\n\nHi ${customer.full_name},\n\nOur driver will arrive in approximately 20 minutes!\n📍 ${originAddress}\n\nPlease have everything ready for loading.\n\nBooking: ${booking.reference}`;
    } else if (status === "10_mins_away") {
      emailSubject = `🚨 Driver Arriving in 10 Minutes! - ${booking.reference}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Driver 10 Minutes Away!</h1>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
            <p style="font-size: 18px; color: #991b1b; font-weight: bold; margin: 20px 0;">
              Our driver will arrive in approximately 10 minutes!
            </p>
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #7f1d1d;">📍 ${originAddress}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Almost there! See you very soon.</p>
          </div>
        </div>
      `;
      smsBody = `🚨 Our driver will arrive in 10 MINUTES at ${originAddress}! Almost there! - ${booking.reference}`;
      whatsappBody = `🚨 *Driver 10 Minutes Away!*\n\nHi ${customer.full_name},\n\nOur driver will arrive in approximately 10 minutes!\n📍 ${originAddress}\n\nAlmost there!\n\nBooking: ${booking.reference}`;
    } else if (status === "15_mins_to_delivery") {
      emailSubject = `🏁 Driver 15 Minutes From Delivery! - ${booking.reference}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏁 Almost At Delivery Address!</h1>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
            <p style="font-size: 18px; color: #1e40af; font-weight: bold; margin: 20px 0;">
              Our driver will arrive at your delivery address in approximately 15 minutes!
            </p>
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1e3a8a;">🏁 ${destinationAddress}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Please be ready to receive your items!</p>
          </div>
        </div>
      `;
      smsBody = `🏁 Our driver will arrive at your delivery address in 15 minutes: ${destinationAddress} - ${booking.reference}`;
      whatsappBody = `🏁 *15 Minutes From Delivery!*\n\nHi ${customer.full_name},\n\nOur driver will arrive in approximately 15 minutes!\n🏁 ${destinationAddress}\n\nPlease be ready to receive your items.\n\nBooking: ${booking.reference}`;
    } else if (status === "job_completed") {
      // Get Google review link from settings
      const { data: settings } = await supabase.from("settings").select("google_review_link").eq("id", 1).single();
      const googleReviewLink = settings?.google_review_link || DEFAULT_GOOGLE_REVIEW_LINK;

      const tipLink = `${process.env.NEXT_PUBLIC_SITE_URL}/tip/${bookingId}`;

      emailSubject = `✅ Move Complete! Thank You! - ${booking.reference}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">✅ Move Complete!</h1>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
            <p style="font-size: 16px; color: #1e293b; margin: 20px 0;">
              Thank you for choosing Ample Removals! 🎉
            </p>
            <p style="font-size: 16px; color: #1e293b; margin: 20px 0;">
              We hope everything went smoothly with your move. It was our pleasure to help you!
            </p>

            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 24px; margin: 32px 0; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #78350f;">💝 Did your driver go above & beyond?</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #92400e;">Show your appreciation with a tip!</p>
              <a href="${tipLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                💷 Tip Your Driver
              </a>
            </div>

            <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 24px; margin: 32px 0; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #15803d;">⭐ Enjoyed our service?</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #166534;">We'd love if you could share your experience on Google!</p>
              <a href="${googleReviewLink}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                ⭐ Leave a Google Review
              </a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
              Your feedback helps us improve and helps others find great service too!
            </p>
            <p style="font-size: 14px; color: #64748b;">
              Thank you again,<br>
              The Ample Removals Team
            </p>
          </div>
        </div>
      `;
      smsBody = `✅ Move complete! Thank you for choosing Ample Removals! Tip your driver: ${tipLink} | Leave review: ${googleReviewLink} - ${booking.reference}`;
      whatsappBody = `✅ *Move Complete!*\n\nHi ${customer.full_name},\n\nThank you for choosing Ample Removals! 🎉\n\n💝 *Tip Your Driver:*\n${tipLink}\n\n⭐ *Leave a Review:*\n${googleReviewLink}\n\nThank you!\nAmple Removals Team`;
    }

    // Send notifications
    try {
      await resend.emails.send({
        from: resendFrom,
        to: customer.email,
        subject: emailSubject,
        html: emailBody,
      });
      console.log(`✅ Email sent to ${customer.email}`);
    } catch (emailErr) {
      console.error(`❌ Email failed:`, emailErr);
    }

    try {
      await sendSMS(customer.phone, smsBody);
      console.log(`✅ SMS sent to ${customer.phone}`);
    } catch (smsErr) {
      console.error(`❌ SMS failed:`, smsErr);
    }

    try {
      await sendWhatsApp(customer.phone, whatsappBody);
      console.log(`✅ WhatsApp sent to ${customer.phone}`);
    } catch (whatsappErr) {
      console.error(`❌ WhatsApp failed:`, whatsappErr);
    }

    return NextResponse.json({
      success: true,
      message: `Driver status updated: ${statusLabels[status]}`,
    });
  } catch (error) {
    console.error("Driver status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
