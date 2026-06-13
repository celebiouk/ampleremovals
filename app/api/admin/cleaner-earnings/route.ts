/**
 * GET /api/admin/cleaner-earnings — list all cleaner earnings
 * POST /api/admin/cleaner-earnings/[id]/approve — approve cleaner earnings
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("cleaner_earnings")
      .select(
        `
        id,
        cleaner_id,
        booking_id,
        gross_earnings,
        tip_amount,
        status,
        created_at,
        cleaners(first_name, last_name, phone),
        bookings(reference, service_type)
      `
      )
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cleaner earnings: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      earnings: data || [],
      count: data?.length || 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
