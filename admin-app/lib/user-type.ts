import { supabase } from "./supabase";
import type { UserType } from "@/types";

/**
 * Mirrors the web `getUserType` boundary: a user with a row in `drivers` is a
 * driver; any other authenticated user is treated as an admin. The mobile app
 * is admin-only, so the auth gate rejects anyone who is not an admin.
 *
 * With the hardened RLS, a driver can only ever see their own driver row, which
 * is exactly what this check needs.
 */
export async function getUserType(userId: string | undefined): Promise<UserType> {
  if (!userId) return "unknown";
  try {
    const { data, error } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) return "unknown";
    return data ? "driver" : "admin";
  } catch {
    return "unknown";
  }
}
