"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Auth bridge for the admin app's WebView. The app opens this page with the
 * Supabase session tokens in the URL **fragment** (so they're never sent to the
 * server): /embed/auth#at=<access>&rt=<refresh>&next=<path>. We set the session
 * (which writes the Supabase cookies), then redirect into the real /admin page —
 * giving the WebView a fully-authenticated, 100%-parity admin experience.
 */
export default function EmbedAuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const at = hash.get("at");
        const rt = hash.get("rt");
        const next = hash.get("next") || "/admin";
        if (!at || !rt) { setError("Missing session"); return; }

        const supabase = createClient();
        const { error: e } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        if (e) { setError(e.message); return; }

        // Give the cookie write a tick to flush before the protected navigation.
        setTimeout(() => router.replace(next), 150);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed");
      }
    })();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui", color: "#475569" }}>
      {error ? `Couldn't sign in: ${error}` : "Loading…"}
    </div>
  );
}
