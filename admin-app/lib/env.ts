/**
 * Runtime config, read from EXPO_PUBLIC_* env vars (inlined by Expo at build).
 * Only public values live here — the service-role key never ships to a device.
 */
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // Base URL of the deployed Next.js app whose /api/admin/** routes we reuse.
  SITE_URL: process.env.EXPO_PUBLIC_SITE_URL ?? "",
};

export function assertEnv(): void {
  const missing = Object.entries(ENV)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    console.warn(
      `[env] Missing EXPO_PUBLIC_* values: ${missing.join(", ")}. ` +
        `Copy .env.example to .env and fill them in.`
    );
  }
}
