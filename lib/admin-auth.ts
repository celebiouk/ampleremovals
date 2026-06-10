import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/user-type";

/**
 * Verifies the caller is an authenticated admin (not anonymous, not a driver).
 *
 * Usage at the top of an admin API handler:
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return auth.response;
 *   // ...proceed; auth.userId is the admin's id
 *
 * Returns a 401 if not logged in, 403 if the user is a driver.
 */
export async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!(await isAdmin(user.id))) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: user.id };
}
