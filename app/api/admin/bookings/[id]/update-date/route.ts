import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, resendFrom } from "@/lib/resend";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { formatMoveTimeWindow } from "@/lib/dates";

/**
 * POST /api/admin/bookings/[id]/update-date
 * Admin updates move date for a booking
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: bookingId } = params;
    const body = await req.json();
    const { moveDate, moveTime, notify = true } = body;

    if (!moveDate) {
      return NextResponse.json(
        { success: false, error: "Move date is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        reference,
        move_date,
        move_time,
        customer:customers!inner(full_name, email, phone)
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
    const oldDate = booking.move_date;
    const oldTime = booking.move_time;
    // Empty string from the time input means "clear it" (falls back to the
    // default 9-10am window everywhere it's shown), not "leave unchanged".
    const newTime: string | null = typeof moveTime === "string" && moveTime.trim() ? moveTime.trim() : null;

    // Update move date AND time — this was the actual bug: the time the admin
    // picked in the modal was read here but never written to the DB, so it
    // never stuck. Setting a specific date also pins the booking to a FIXED
    // date, so clear the flexible-date flag — otherwise the UI keeps showing
    // the old "Flexible: from – to" range and the change looks like it didn't
    // take.
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ move_date: moveDate, move_time: newTime, is_flexible_date: false })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update move date" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: "Move date/time updated by admin",
      metadata: { old_date: oldDate, new_date: moveDate, old_time: oldTime, new_time: newTime },
      performed_by: "admin",
    });

    const oldDateFormatted = oldDate ? new Date(oldDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }) : "Not set";

    const newDateFormatted = new Date(moveDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const newWindow = formatMoveTimeWindow(newTime);
    const first = (customer.full_name || "there").split(" ")[0];

    // Only notify customer if requested
    if (notify) {
      // Notify customer — email + SMS + WhatsApp, the owner's standard for
      // every customer-facing message, so they always know the arrival
      // window and don't have to guess or panic about timing.
      const emailSubject = `📅 Move Date Updated - ${booking.reference}`;
      const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">📅 Move Date Updated</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #1e293b;">Hi ${customer.full_name},</p>
          <p style="font-size: 16px; color: #1e293b; margin: 20px 0;">
            Your move date has been updated.
          </p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Previous Date:</strong></td>
                <td style="padding: 8px 0; color: #92400e;">${oldDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>New Date:</strong></td>
                <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${newDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #78350f;"><strong>Arrival Window:</strong></td>
                <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${newWindow}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 14px; color: #64748b;">
            If you have any questions, please contact us on 0333 577 2070.
          </p>
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
            Booking Reference: ${booking.reference}
          </p>
        </div>
      </div>
    `;

      try {
        await resend.emails.send({
          from: resendFrom,
          to: customer.email,
          subject: emailSubject,
          html: emailBody,
        });
      } catch (emailErr) {
        console.error("Customer notification failed:", emailErr);
      }

      const plainBody = `Ample Removals: Hi ${first}, your move date has been updated to ${newDateFormatted}, arrival window ${newWindow}. Ref: ${booking.reference}. Questions? 0333 577 2070`;
      if (customer.phone) {
        await sendSMS(customer.phone, plainBody).catch(() => {});
        await sendWhatsApp(
          customer.phone,
          `📅 *Move Date Updated*\n\nHi ${first}, your Ample Removals booking has a new date:\n\n📋 *${booking.reference}*\n📆 ${newDateFormatted}\n⏰ Arrival window: ${newWindow}\n\nAny questions, call *0333 577 2070*.`,
          { name: "booking_details_updated", variables: { "1": first, "2": "move date and time", "3": booking.reference } },
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: notify
        ? "Move date updated and customer notified"
        : "Move date updated (customer not notified)",
    });
  } catch (error) {
    console.error("Update date error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
