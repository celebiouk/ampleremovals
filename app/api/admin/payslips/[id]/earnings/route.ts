/**
 * GET /api/admin/payslips/[id]/earnings — get earnings breakdown for a payslip
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get payslip + linked earnings
    const { data: links, error: linkError } = await supabase
      .from("payslip_earnings")
      .select("earning_id")
      .eq("payslip_id", params.id);

    if (linkError) {
      throw new Error(`Failed to fetch earnings links: ${linkError.message}`);
    }

    const earningIds = links?.map((l) => l.earning_id) || [];

    if (earningIds.length === 0) {
      return NextResponse.json({ success: true, earnings: [], totals: { gross: 0, tips: 0, total: 0 } });
    }

    // Get earnings details
    const { data: earnings, error: earningError } = await supabase
      .from("driver_earnings")
      .select(
        `
        id,
        booking_id,
        bookings(reference, created_at),
        gross_earnings,
        tip_amount
      `
      )
      .in("id", earningIds);

    if (earningError) {
      throw new Error(`Failed to fetch earnings: ${earningError.message}`);
    }

    // Compute totals
    const totals = {
      gross: earnings?.reduce((sum, e) => sum + e.gross_earnings, 0) || 0,
      tips: earnings?.reduce((sum, e) => sum + e.tip_amount, 0) || 0,
      total: 0,
    };
    totals.total = totals.gross + totals.tips;

    return NextResponse.json({
      success: true,
      earnings: earnings?.map((e: any) => ({
        id: e.id,
        booking_id: e.booking_id,
        booking_reference: e.bookings?.reference,
        booking_date: e.bookings?.created_at,
        gross_earnings: e.gross_earnings,
        tip_amount: e.tip_amount,
        total: e.gross_earnings + e.tip_amount,
      })) || [],
      totals,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
