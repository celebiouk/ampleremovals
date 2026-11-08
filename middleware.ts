import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { brandForHost } from "@/lib/brands";

// Exact paths that get a brand-specific page on the white-label domains —
// every other path (booking, /quote, /admin, /api, etc.) passes through
// untouched and shares the one booking engine/admin regardless of which
// domain it was reached from.
const BRAND_PAGE_PATHS = new Set(["/", "/man-and-van", "/house-clearance", "/rubbish-removal", "/about", "/contact", "/tips"]);
// Path prefixes that also get rewritten (anything under them) — just /tips/[slug]
// for now, since that's the only brand route with its own sub-paths.
const BRAND_PAGE_PREFIXES = ["/tips/"];

function isBrandPage(pathname: string): boolean {
  return BRAND_PAGE_PATHS.has(pathname) || BRAND_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
}

// Ample's own programmatic SEO pages — 16 hubs / 170 villages across
// Berkshire, Hampshire, Oxfordshire and Wiltshire (lib/hubs.ts, lib/villages.ts)
// plus /locations/[location]. Every one of these pages has a canonical tag
// hardcoded to https://www.ampleremovals.com/... . Each white-label brand only
// serves 1-2 towns (see Brand.towns in lib/brands.ts), so there is no brand
// equivalent of this page — but letting it fall through unrewritten used to
// serve Ample's own page (wrong branding, wrong phone number) under the
// brand's domain, with a canonical tag telling Google that copy belongs to
// ampleremovals.com. That actively suppressed indexing of the brand's own
// pages. Redirect back to the brand's real equivalent page instead.
const AMPLE_LOCATION_PREFIXES: { prefix: string; brandEquivalent: string }[] = [
  { prefix: "/house-removals/", brandEquivalent: "/" },
  { prefix: "/man-and-van/", brandEquivalent: "/man-and-van" },
  { prefix: "/house-clearance/", brandEquivalent: "/house-clearance" },
  { prefix: "/rubbish-removal/", brandEquivalent: "/rubbish-removal" },
  { prefix: "/locations/", brandEquivalent: "/" },
];

function ampleLocationBrandEquivalent(pathname: string): string | null {
  const match = AMPLE_LOCATION_PREFIXES.find((m) => pathname.startsWith(m.prefix));
  return match?.brandEquivalent ?? null;
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

  if (brand.slug !== "ample") {
    const brandEquivalent = ampleLocationBrandEquivalent(request.nextUrl.pathname);
    if (brandEquivalent) {
      const url = request.nextUrl.clone();
      url.pathname = brandEquivalent;
      return NextResponse.redirect(url, 308);
    }
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
