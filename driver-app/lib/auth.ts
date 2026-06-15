import { supabase } from "./supabase";

export interface SignInResult {
  ok: boolean;
  error?: string;
  driverId?: string;
}

/** The driver row (by auth_user_id) for the signed-in user, or null. */
export async function getDriverRecord(userId: string): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("drivers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Sign in a driver. Mirrors the web boundary inverted: after authenticating we
 * verify the user IS a driver. Non-drivers are signed straight back out — this
 * app is driver-only.
 */
export async function signInDriver(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) return { ok: false, error: "Invalid email or password." };

  const driver = await getDriverRecord(data.user.id);
  if (!driver) {
    await supabase.auth.signOut();
    return { ok: false, error: "This app is for drivers only." };
  }
  return { ok: true, driverId: driver.id };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Where the reset email's link lands. We send the driver to the web "set new
 * password" page (which already handles the recovery session) rather than a
 * native deep link — it's reliable cross-device and reuses one working flow for
 * web + app. This exact URL must be in Supabase Auth → URL Configuration →
 * Redirect URLs.
 */
const RESET_REDIRECT_URL = "https://www.ampleremovals.com/drivers/reset-password/update";

export async function sendPasswordReset(email: string): Promise<SignInResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: RESET_REDIRECT_URL,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
