import { NextRequest, NextResponse } from "next/server";
import { drivingDistanceMiles } from "@/lib/google-maps";

export const runtime = "nodejs";

/**
 * POST /api/postcode/distance
 * Driving distance between two postcodes in miles (Google Distance Matrix,
 * mode=driving — the same source the driver ETA uses; never straight-line).
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

    const distance = await drivingDistanceMiles(from, to);

    return NextResponse.json({ success: true, distance });
  } catch (error) {
    console.error("Distance calculation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate distance" },
      { status: 500 }
    );
  }
}
