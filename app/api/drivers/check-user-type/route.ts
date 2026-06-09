import { NextRequest, NextResponse } from "next/server";
import { getUserType } from "@/lib/user-type";

/**
 * POST /api/drivers/check-user-type
 * Checks if a user is an admin or driver
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    const userType = await getUserType(userId);

    return NextResponse.json({
      success: true,
      userType,
    });
  } catch (error) {
    console.error("Check user type error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
