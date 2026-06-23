/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { sendAdminPush } from "@/lib/push-dispatch";
import { normaliseSmsBody } from "@/lib/twilio";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * POST /api/drivers/jobs/[bookingId]/status
 * Driver updates job status (triggers customer notifications)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params;
    const { status, note } = await req.json();

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get authenticated user (driver)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get driver record
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, first_name, preferred_name")
      .eq("auth_user_id", user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 403 }
      );
    }

    // Verify driver is assigned to this booking
    const { data: assignment } = await supabase
      .from("booking_driver_assignments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("driver_id", driver.id)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Not authorized for this job" },
        { status: 403 }
      );
    }

    // Get booking details with customer
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, customer:customers(*)")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Insert status update
    const { error: insertError } = await supabase
      .from("driver_job_status_updates")
      .insert({
        booking_id: bookingId,
        driver_id: driver.id,
        status,
        note,
      });

    if (insertError) {
      console.error("Insert status update error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save status update" },
        { status: 500 }
      );
    }

    // Update booking latest_driver_status
    await supabase
      .from("bookings")
      .update({ latest_driver_status: status })
      .eq("id", bookingId);

    // If job completed, update booking status
    if (status === "job_completed") {
      await supabase
        .from("bookings")
        .update({ status: "job_completed" })
        .eq("id", bookingId);

      // Insert status history
      await supabase.from("status_history").insert({
        booking_id: bookingId,
        status: "job_completed",
        changed_by: `Driver: ${driver.preferred_name || driver.first_name}`,
      });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Driver ${driver.preferred_name || driver.first_name} updated status: ${JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS]}`,
      metadata: { status, note, driver_id: driver.id },
      performed_by: "driver",
    });

    // Send customer notifications
    await sendCustomerNotifications(booking, status, note);

    // Notify the admin app that a driver updated the job status
    await sendAdminPush({
      title: "🚚 Driver update",
      body: `${driver.preferred_name || driver.first_name}: ${JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS]} (${booking.reference})`,
      data: { bookingId },
    });

    return NextResponse.json({
      success: true,
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendCustomerNotifications(
  booking: any,
  status: string,
  note: string | null
) {
  const customer = booking.customer;
  const customerFirstName = customer.full_name.split(" ")[0];

  // Status-specific messages
  const messages: Record<string, { email: string; sms: string }> = {
    on_my_way: {
      email: `Great news — your driver is on their way to you now. Please make sure you are ready for their arrival.`,
      sms: `Hi ${customerFirstName}, your driver is on their way to you now. Please be ready! – Ample Removals`,
    },
    twenty_mins_away: {
      email: `Your driver is approximately 20 minutes away. Please make sure you are ready to receive them.`,
      sms: `Hi ${customerFirstName}, your driver is ~20 mins away. Get ready! – Ample Removals`,
    },
    ten_mins_away: {
      email: `Your driver is 10 minutes away — they will be with you very shortly. Please be ready at the property.`,
      sms: `Hi ${customerFirstName}, your driver is 10 mins away! – Ample Removals`,
    },
    fifteen_mins_to_delivery: {
      email: `Your driver is 15 minutes away from the delivery address. Please be ready to receive your belongings.`,
      sms: `Hi ${customerFirstName}, your driver is 15 mins from delivery. Be ready! – Ample Removals`,
    },
    job_completed: {
      email: `Your move has been completed. We hope everything went smoothly! If you have any questions or feedback, please do not hesitate to get in touch.`,
      sms: `Hi ${customerFirstName}, your move is complete. Thank you for choosing us! – Ample Removals`,
    },
  };

  const msg = messages[status];
  if (!msg) return;

  // Send Email
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: customer.email,
      subject: `Update on your move — ${JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS]}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6b21a8 0%, #581c87 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ample Removals — Job Update</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #e2e8f0;">
            <p style="font-size: 16px; color: #334155; margin: 0 0 16px 0;">Hi ${customerFirstName},</p>
            <p style="font-size: 16px; color: #334155; margin: 0 0 16px 0;">${msg.email}</p>
            ${note ? `<div style="background: #f1f5f9; border-left: 4px solid #6b21a8; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Message from your driver:</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;">${note}</p>
            </div>` : ''}
            <p style="font-size: 14px; color: #64748b; margin: 24px 0 0 0;">
              Booking reference: <strong>${booking.reference}</strong>
            </p>
            <p style="font-size: 14px; color: #64748b; margin: 8px 0 0 0;">
              If you have any concerns, please call us.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email send error:", error);
  }

  // Send SMS
  try {
    const twilio = (await import("twilio")).default;
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
    await twilioClient.messages.create({
      body: normaliseSmsBody(msg.sms),
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customer.phone,
    });
  } catch (error) {
    console.error("SMS send error:", error);
  }

  // Send WhatsApp
  try {
    const twilio = (await import("twilio")).default;
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
    await twilioClient.messages.create({
      body: msg.sms,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${customer.phone}`,
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);
  }
}
