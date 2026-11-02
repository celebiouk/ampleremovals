import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { brandForHost } from "@/lib/brands";

// Exact paths that get a brand-specific page on the white-label domains —
// every other path (booking, /quote, /admin, /api, etc.) passes through
// untouched and shares the one booking engine/admin regardless of which
// domain it was reached from.
const BRAND_PAGE_PATHS = new Set(["/", "/man-and-van", "/house-clearance", "/about", "/contact", "/tips"]);
// Path prefixes that also get rewritten (anything under them) — just /tips/[slug]
// for now, since that's the only brand route with its own sub-paths.
const BRAND_PAGE_PREFIXES = ["/tips/"];

function isBrandPage(pathname: string): boolean {
  return BRAND_PAGE_PATHS.has(pathname) || BRAND_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
}

// Ample Logistics (amplelogistics.co.uk) is a different business line, not
// a removals white-label brand — it deliberately does NOT go through
// lib/brands.ts's Brand/x-brand system. Its 5 marketing pages live under
// app/(logistics)/logistics/*; everything else (/admin, /api) passes
// through untouched and shares the same admin/database as removals.
const LOGISTICS_HOST = "amplelogistics.co.uk";
const LOGISTICS_PAGE_PATHS = new Set(["/", "/businesses", "/drivers", "/about", "/contact", "/privacy-notice", "/terms"]);

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");

  if (host === LOGISTICS_HOST && LOGISTICS_PAGE_PATHS.has(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname === "/" ? "/logistics" : `/logistics${request.nextUrl.pathname}`;
    return NextResponse.rewrite(url, { request: { headers: request.headers } });
  }

  // Resolve which white-label storefront this request is for from the Host
  // header, and forward it so server components can read it via
  // headers().get("x-brand") (see lib/brand-context.ts).
  const brand = brandForHost(request.headers.get("host"));
  request.headers.set("x-brand", brand.slug);

  if (brand.slug !== "ample" && isBrandPage(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${brand.slug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
    return NextResponse.rewrite(url, { request: { headers: request.headers } });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets and image optimisation files.
     * Admin protection is enforced inside updateSession().
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
