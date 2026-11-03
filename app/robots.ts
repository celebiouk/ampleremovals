import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { brandForHost, AMPLE_BRAND } from "@/lib/brands";
import { LOGISTICS } from "@/lib/logistics";

// Must be dynamic — the whole point is to vary by the Host header so each
// white-label domain's /robots.txt points at ITS OWN /sitemap.xml instead
// of silently always pointing at ampleremovals.com's (the bug that meant
// Google had no sitemap-based discovery path at all for the brand domains
// — see tasks/brand-playbook.md).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const host = headers().get("host");
  const clean = (host ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");

  const baseUrl =
    clean === LOGISTICS.domain
      ? `https://${LOGISTICS.domain}`
      : brandForHost(host) !== AMPLE_BRAND
        ? `https://${brandForHost(host).domain}`
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/confirmation", "/payment-success"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
