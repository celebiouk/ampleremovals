import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { brandForHost } from "@/lib/brands";

// Paths that get a brand-specific page on the 3 white-label domains — every
// other path (booking, /quote, /admin, /api, etc.) passes through untouched
// and shares the one booking engine/admin regardless of which domain it was
// reached from.
const BRAND_PAGE_PATHS = new Set(["/", "/man-and-van", "/house-clearance"]);

export async function middleware(request: NextRequest) {
  // Resolve which white-label storefront this request is for from the Host
  // header, and forward it so server components can read it via
  // headers().get("x-brand") (see lib/brand-context.ts).
  const brand = brandForHost(request.headers.get("host"));
  request.headers.set("x-brand", brand.slug);

  if (brand.slug !== "ample" && BRAND_PAGE_PATHS.has(request.nextUrl.pathname)) {
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
