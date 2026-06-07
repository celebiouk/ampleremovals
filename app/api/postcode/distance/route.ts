import { NextRequest, NextResponse } from "next/server";
import { calculateDistance } from "@/lib/postcode";

/**
 * POST /api/postcode/distance
 * Calculate distance between two postcodes in miles
 */
export async function POST(req: NextRequest) {
  try {
    const { from, to } = await req.json();

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: "Both 'from' and 'to' postcodes are required" },
        { status: 400 }
      );
    }

    const distance = await calculateDistance(from, to);

    return NextResponse.json({ success: true, distance });
  } catch (error) {
    console.error("Distance calculation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate distance" },
      { status: 500 }
    );
  }
}
