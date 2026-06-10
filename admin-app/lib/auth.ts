import { supabase } from "./supabase";
import { getUserType } from "./user-type";
import type { AdminRole } from "@/types";

export interface SignInResult {
  ok: boolean;
  error?: string;
}

/**
 * Sign in an admin. Mirrors the web boundary: after authenticating we verify
 * the user is NOT a driver. Drivers are signed straight back out — this app is
 * admin-only.
 */
export async function signInAdmin(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: "Invalid email or password." };
  }

  const type = await getUserType(data.user.id);
  if (type !== "admin") {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This app is for admins only. Drivers should use the driver portal.",
    };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Send a password-reset email that deep-links back into the app. */
export async function sendPasswordReset(email: string): Promise<SignInResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: "ampleadmin://update-password",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePassword(newPassword: string): Promise<SignInResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * The current admin's role, read straight from `admin_users`
 * (keyed by supabase_user_id). Returns null if not an admin row.
 */
export async function getCurrentAdminRole(): Promise<AdminRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("admin_users")
    .select("role")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  return (data?.role as AdminRole) ?? null;
}
