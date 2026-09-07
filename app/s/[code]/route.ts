import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /s/[code] — resolves a short SMS link and 302-redirects to the real
 * destination (a quote page, a lead-completion link, etc.). Unknown/expired
 * codes fall back to the homepage rather than a dead end.
 */
export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("short_links").select("target_url").eq("code", params.code).maybeSingle();
    if (data?.target_url) return NextResponse.redirect(data.target_url, { status: 302 });
  } catch { /* fall through to homepage */ }
  return NextResponse.redirect(site, { status: 302 });
}
