import { ENV } from "./env";
import { supabase } from "./supabase";

/**
 * Typed fetch wrapper for the existing Next.js admin API.
 *
 * Calls `${SITE_URL}/api/admin/**` with the current Supabase session's bearer
 * token so the server-side `requireAdmin` guard accepts the request. All
 * privileged work stays on the server — the device never holds the service key.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
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

  // Throw on error so callers' try/catch works; read the error body from a
  // clone so the caller can still consume res.json()/res.text()/res.arrayBuffer().
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = (await res.clone().json()) as { error?: string } | null;
      message = j?.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  // Returns the raw Response — callers call `.json()` / `.text()` / `.arrayBuffer()`.
  return res;
}
