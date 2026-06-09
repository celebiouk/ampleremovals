/**
 * User Type Detection
 * Determines if an authenticated user is an admin or a driver
 */

import { createAdminClient } from "@/lib/supabase/server";

export type UserType = "admin" | "driver" | "unknown";

/**
 * Determines the type of user based on their auth UUID
 *
 * Logic:
 * - Query drivers table for auth_user_id = userId
 * - If found: user is a driver
 * - If not found: user is an admin (default assumption)
 * - If error or no userId: unknown
 *
 * In the future, an admins table could be added for stricter checks.
 *
 * @param userId - Supabase Auth user UUID
 * @returns "admin" | "driver" | "unknown"
 */
export async function getUserType(userId: string | undefined): Promise<UserType> {
  if (!userId) {
    return "unknown";
  }

  try {
    const supabase = createAdminClient();

    // Check if user exists in drivers table
    const { data, error } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    if (error) {
      // If error is "no rows": user is not a driver, assume admin
      if (error.code === "PGRST116") {
        return "admin";
      }
      // Other errors: unknown
      console.error("getUserType error:", error);
      return "unknown";
    }

    // If driver record found: user is a driver
    if (data) {
      return "driver";
    }

    // Default: assume admin
    return "admin";
  } catch (error) {
    console.error("getUserType exception:", error);
    return "unknown";
  }
}

/**
 * Checks if a user is a driver
 * @param userId - Supabase Auth user UUID
 */
export async function isDriver(userId: string | undefined): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === "driver";
}

/**
 * Checks if a user is an admin
 * @param userId - Supabase Auth user UUID
 */
export async function isAdmin(userId: string | undefined): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === "admin";
}
