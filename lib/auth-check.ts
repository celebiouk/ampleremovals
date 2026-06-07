import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Reusable admin authentication check for API routes.
 * Returns user info if authenticated, or NextResponse with 401 if not.
 *
 * Usage in API routes:
 * ```ts
 * const auth = await requireAdminAuth(request);
 * if (auth instanceof NextResponse) return auth;
 * // Proceed with route logic, auth.userId is available
 * ```
 */
export async function requireAdminAuth(
  request: Request
): Promise<{ userId: string; userEmail: string } | NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return {
      userId: user.id,
      userEmail: user.email || "",
    };
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 401 }
    );
  }
}
