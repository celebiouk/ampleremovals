import { getCurrentBrand } from "@/lib/brand-context";
import type { Brand } from "@/lib/brands";

/**
 * Resolve how a brand page's own internal links should be written for
 * THIS request. Once a brand's real domain is connected, the Host header
 * already matches it and links stay plain root-relative ("/", "/about",
 * ...) — normal. Until then, these pages are only reachable by path on
 * another domain (e.g. ampleremovals.com/thatcham-movers, used for
 * previewing before DNS is pointed), where a plain "/about" link would
 * incorrectly resolve to THAT domain's own /about instead of staying on
 * the brand's preview path. This prefixes internal links so navigation
 * works correctly in both cases without any change needed once a brand's
 * domain actually goes live.
 */
export async function resolveBrandBasePath(brand: Brand): Promise<string> {
  const hostBrand = await getCurrentBrand();
  return hostBrand.slug === brand.slug ? "" : `/${brand.slug}`;
}

const BRAND_INTERNAL_PATHS = new Set(["/", "/man-and-van", "/house-clearance", "/about", "/contact", "/tips"]);

/** Prefix an internal brand link with the resolved base path. Leaves
 *  shared paths (/booking, /booking/man-and-van), anchors, tel:, mailto:
 *  and external links untouched — those are never brand-namespaced. */
export function brandHref(basePath: string, href: string): string {
  if (!basePath) return href;
  if (href.startsWith("tel:") || href.startsWith("mailto:") || href.startsWith("http") || href.startsWith("#")) return href;
  if (href === "/") return basePath;
  if (href.startsWith("/tips/") || BRAND_INTERNAL_PATHS.has(href)) return `${basePath}${href}`;
  return href;
}
