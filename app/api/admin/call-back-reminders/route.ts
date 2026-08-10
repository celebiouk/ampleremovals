import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/call-back-reminders
 * Create a new call back reminder
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get admin user ID
    const { data: adminUser } = await supabaseAuth
      .from("admin_users")
      .select("id")
      .eq("supabase_user_id", user.id)
      .single();

    const body = await req.json();
    const { bookingId, customerId, reminderDatetime, reason, notes } = body;

    if (!bookingId || !customerId || !reminderDatetime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Don't let two call-backs share the same time slot — you can't call two
    // people at once. Reject if another PENDING reminder is at the same time.
    const dt = new Date(reminderDatetime);
    if (!isNaN(dt.getTime())) {
      const windowStart = new Date(dt.getTime() - 60_000).toISOString();
      const windowEnd = new Date(dt.getTime() + 60_000).toISOString();
      const { data: clashes } = await supabase
        .from("call_back_reminders")
        .select("id, reminder_datetime, customer:customers(full_name)")
        .eq("status", "pending")
        .gte("reminder_datetime", windowStart)
        .lte("reminder_datetime", windowEnd)
        .limit(1);
      if (clashes && clashes.length) {
        const clash = clashes[0] as { reminder_datetime: string; customer?: { full_name?: string } | { full_name?: string }[] };
        const cust = Array.isArray(clash.customer) ? clash.customer[0] : clash.customer;
        const who = cust?.full_name ? ` (${cust.full_name})` : "";
        // Reminder times are stored as the picked wall-clock time (as UTC), so
        // read them back in UTC to show exactly what was chosen (no BST shift).
        const when = new Date(clash.reminder_datetime).toLocaleString("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        return NextResponse.json(
          { success: false, error: `That time slot is already taken${who} — ${when}. Please pick a different time.` },
          { status: 409 }
        );
      }
    }

    // Create reminder
    const { data: reminder, error } = await supabase
      .from("call_back_reminders")
      .insert({
        booking_id: bookingId,
        customer_id: customerId,
        reminder_datetime: reminderDatetime,
        reason,
        notes,
        created_by: adminUser?.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Create reminder error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create reminder" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      booking_id: bookingId,
      action: `Call back reminder set for ${new Date(reminderDatetime).toLocaleString("en-GB")}`,
      metadata: { reminderId: reminder.id, reason },
      performed_by: "admin",
    });

    return NextResponse.json({
      success: true,
      reminder,
    });
  } catch (error) {
    console.error("Call back reminder creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/call-back-reminders
 * Get all pending call back reminders
 */
export async function GET() {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get pending reminders
    const { data: reminders, error } = await supabase
      .from("call_back_reminders")
      .select(`
        *,
        booking:bookings(reference, service_type),
        customer:customers(full_name, phone, email)
      `)
      .eq("status", "pending")
      .order("reminder_datetime", { ascending: true });

    if (error) {
      console.error("Fetch reminders error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch reminders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reminders,
    });
  } catch (error) {
    console.error("Fetch reminders error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
