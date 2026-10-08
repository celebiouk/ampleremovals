import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /private-view/[token] — serves a one-off private document (e.g. a
 * printable customer-message trail) by its unguessable token. Not linked
 * from anywhere on the site and not indexable — the token itself is the
 * only access control, so this is for sharing a specific link with a
 * specific person, not for anything that needs real authentication.
 */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("private_documents")
    .select("html, expires_at")
    .eq("token", params.token)
    .maybeSingle();

  if (!data || (data.expires_at && new Date(data.expires_at) < new Date())) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(data.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store",
    },
  });
}
