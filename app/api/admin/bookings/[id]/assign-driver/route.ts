import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { detectDriverConflicts } from "@/lib/conflict-detection";
import { generateAssignmentToken } from "@/lib/tokens";

/**
 * POST /api/admin/bookings/[id]/assign-driver
 * Assign a driver to a booking
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id: bookingId } = params;
    const { driverId, payPercentageOverride, isLeadDriver, role } = await req.json();

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: "Driver ID required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if already assigned
    const { data: existing } = await supabase
      .from("booking_driver_assignments")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("driver_id", driverId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Driver already assigned to this booking" },
        { status: 400 }
      );
    }

    // Get driver details
    const { data: driver } = await supabase
      .from("drivers")
      .select("first_name, last_name, preferred_name, email, phone, default_pay_percentage")
      .eq("id", driverId)
      .single();

    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from("booking_driver_assignments")
      .insert({
        booking_id: bookingId,
        driver_id: driverId,
        pay_percentage_override: payPercentageOverride,
        is_lead_driver: isLeadDriver ?? false,
      })
      .select()
      .single();

    if (assignError) {
      console.error("Assignment error:", assignError);
      return NextResponse.json(
        { success: false, error: "Failed to assign driver" },
        { status: 500 }
      );
    }

    // Set the role separately + best-effort, so a missing migration can't block
    // the assignment itself (defaults to 'driver').
    if (role === "porter") {
      await supabase.from("booking_driver_assignments").update({ role: "porter" }).eq("id", assignment.id);
    }

    // Create earnings placeholder (will be calculated when invoice is paid)
    const payPercentage = payPercentageOverride || driver.default_pay_percentage;

    await supabase.from("driver_earnings").insert({
      driver_id: driverId,
      booking_id: bookingId,
      assignment_id: assignment.id,
      booking_total: 0,
      pay_percentage: payPercentage,
      gross_earnings: 0,
      tip_amount: 0,
      total_earnings: 0,
      status: "pending",
    });

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Driver assigned: ${driver.first_name} ${driver.last_name}`,
      metadata: { driver_id: driverId, assignment_id: assignment.id },
      performed_by: "admin",
    });

    // Notify the driver they've been assigned (Email + SMS + WhatsApp).
    // Best-effort: notification failures must never fail the assignment.
    await notifyDriverAssigned(supabase, bookingId, driverId, driver);

    // Surface (don't block on) scheduling clashes for this driver.
    const conflicts = await detectDriverConflicts(supabase, driverId, bookingId).catch(() => []);

    return NextResponse.json({
      success: true,
      assignment,
      conflicts,
    });
  } catch (error) {
    console.error("POST assign-driver error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Sends the driver an Email + SMS + WhatsApp telling them about a new job.
 * Best-effort — every channel is wrapped so a failure never blocks the
 * assignment (per the project's notification rules).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
async function notifyDriverAssigned(
  supabase: any,
  bookingId: string,
  driverId: string,
  driver: { first_name: string; preferred_name: string | null; email: string | null; phone: string | null }
) {
  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        `
        reference, service_type, move_date,
        origin_address:addresses!origin_address_id(postcode),
        destination_address:addresses!destination_address_id(postcode)
      `
      )
      .eq("id", bookingId)
      .single();

    if (!booking) return;

    const name = driver.preferred_name || driver.first_name || "there";
    const service = (booking.service_type || "job").replace(/_/g, " ");
    const dateStr = booking.move_date
      ? new Date(booking.move_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "TBC";
    const pickup = booking.origin_address?.postcode || "—";
    const dropoff = booking.destination_address?.postcode;
    const route = dropoff ? `${pickup} → ${dropoff}` : pickup;
    // Token-gated, no-login link to view details + accept/decline.
    const token = generateAssignmentToken(bookingId, driverId);
    const respondUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/drivers/respond/${bookingId}/${driverId}/${token}`;

    // Email
    if (driver.email) {
      try {
        await resend.emails.send({
          from: resendFrom,
          to: driver.email,
          subject: `New job assigned — please accept or decline (${booking.reference})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6b21a8;">You've been assigned a new job</h2>
              <p>Hi ${name},</p>
              <p>You've been assigned to a ${service} job. Please <strong>view the details and let us know if you can take it</strong>.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Date:</strong> ${dateStr}</p>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Route:</strong> ${route}</p>
                <p><strong>Reference:</strong> ${booking.reference}</p>
              </div>
              <a href="${respondUrl}" style="display:inline-block;background:#6b21a8;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
                View details &amp; respond
              </a>
              <p style="margin-top:16px;color:#64748b;font-size:13px;">On the next screen you can <strong>Accept</strong> or <strong>Decline</strong> this job.</p>
              <p style="margin-top:24px;">Thanks,<br><strong>Ample Removals</strong></p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Driver assignment email failed:", e);
      }
    }

    // SMS + WhatsApp
    if (driver.phone) {
      const msg = `Hi ${name}, you've been assigned a ${service} job on ${dateStr} (${route}). Ref ${booking.reference}. View details & accept/decline: ${respondUrl}`;
      try {
        await sendSMS(driver.phone, msg);
      } catch (e) {
        console.error("Driver assignment SMS failed:", e);
      }
      try {
        await sendWhatsApp(driver.phone, msg, {
          name: "driver_job_assigned",
          variables: { "1": name, "2": booking.reference, "3": dateStr, "4": respondUrl },
        });
      } catch (e) {
        console.error("Driver assignment WhatsApp failed:", e);
      }
    }
  } catch (error) {
    console.error("notifyDriverAssigned error:", error);
  }
}
