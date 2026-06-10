import { ENV } from "./env";
import { supabase } from "./supabase";

/**
 * Typed fetch wrapper for the existing Next.js admin API.
 *
 * Calls `${SITE_URL}/api/admin/**` with the current Supabase session's bearer
 * token so the server-side `requireAdmin` guard accepts the request. All
 * privileged work stays on the server — the device never holds the service key.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${ENV.SITE_URL}${path}`, { ...options, headers });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* some routes (e.g. PDF) don't return JSON */
  }

  if (!res.ok) {
    const message =
      (json as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}
