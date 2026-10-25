/**
 * POST /api/track/page-view — fire-and-forget page view logging for the
 * admin Traffic page. Never blocks or fails the page render; errors are
 * swallowed rather than surfaced to the visitor.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { path?: string; sessionId?: string; referrer?: string; utmSource?: string } | null;
  if (!body?.path || !body?.sessionId) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const supabase = createAdminClient();
  await supabase.from("page_views").insert({
    path: body.path.slice(0, 500),
    session_id: body.sessionId.slice(0, 100),
    referrer: body.referrer?.slice(0, 500) || null,
    utm_source: body.utmSource?.slice(0, 100) || null,
  });

  return NextResponse.json({ success: true });
}
