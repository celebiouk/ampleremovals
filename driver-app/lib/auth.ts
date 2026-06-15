import { supabase } from "./supabase";
import { ENV } from "./env";

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
 * Trigger a driver password reset. Calls our own API route, which mints the
 * secure link via the admin API and sends a branded email through Resend (not
 * Supabase's default mailer). The link lands on the web "set new password" page.
 * Always resolves ok on a 2xx — the route never reveals whether an account exists.
 */
export async function sendPasswordReset(email: string): Promise<SignInResult> {
  try {
    const res = await fetch(`${ENV.SITE_URL}/api/drivers/reset-password/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (!res.ok) return { ok: false, error: "Could not send the reset email. Please try again." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Please check your connection and try again." };
  }
}
