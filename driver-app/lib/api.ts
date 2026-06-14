import { ENV } from "./env";
import { supabase } from "./supabase";

/**
 * Bearer-aware fetch to the Next.js /api/drivers/** routes. Returns the raw
 * Response (callers use .json()/.text()), throwing on !ok with the server's
 * error message — same contract as the admin app's apiFetch.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }
  if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

  const res = await fetch(`${ENV.SITE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = (await res.clone().json()) as { error?: string } | null;
      message = j?.error ?? message;
    } catch {
      /* non-JSON error */
    }
    throw new Error(message);
  }
  return res;
}
