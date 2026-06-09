import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/referral/validate
 * Validates a referral code and returns referrer info
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing referral code" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find customer with this referral code
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, full_name, referral_code")
      .eq("referral_code", code.toUpperCase())
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      referrer: {
        name: customer.full_name,
        code: customer.referral_code,
      },
      discount: 20, // £20 off
    });
  } catch (error) {
    console.error("Referral validate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
