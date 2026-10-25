"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_KEY = "ample_session_id";

function getSessionId(): string {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

/** Logs one page view per navigation for the admin Traffic page. Renders nothing. */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const utmSource = searchParams.get("utm_source") || undefined;
    fetch("/api/track/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        sessionId: getSessionId(),
        referrer: document.referrer || undefined,
        utmSource,
      }),
      keepalive: true,
    }).catch(() => {
      /* best-effort — never blocks or surfaces to the visitor */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
