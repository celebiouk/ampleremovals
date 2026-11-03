import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { VILLAGES } from "@/lib/villages";
import { LOCATIONS } from "@/lib/locations";
import { brandForHost, AMPLE_BRAND, type Brand } from "@/lib/brands";
import { LOGISTICS } from "@/lib/logistics";
import { thatchamMoversTips } from "@/lib/brand-page-content/thatcham-movers";
import { newburyRemovalsTips } from "@/lib/brand-page-content/newbury-removals";
import { manyVansTips } from "@/lib/brand-page-content/manyvans";

const VILLAGE_SERVICES = ["man-and-van", "house-removals", "house-clearance", "rubbish-removal"] as const;

const BRAND_TIPS: Record<string, { slug: string }[]> = {
  "thatcham-movers": thatchamMoversTips,
  "newbury-removals": newburyRemovalsTips,
  manyvans: manyVansTips,
};

/**
 * Each white-label brand's own sitemap — its 5 real pages plus its tips
 * articles. Previously every domain (including these) served Ample
 * Removals' own sitemap.xml, which contains zero of these domains' URLs —
 * meaning Google had no sitemap-based way to discover thatchammovers.co.uk
 * (etc.) at all. See tasks/brand-playbook.md.
 */
function brandSitemap(brand: Brand): MetadataRoute.Sitemap {
  const baseUrl = `https://${brand.domain}`;
  const pages = ["", "/man-and-van", "/house-clearance", "/about", "/contact", "/tips"];
  const tips = BRAND_TIPS[brand.slug] ?? [];
  return [
    ...pages.map((p) => ({
      url: `${baseUrl}${p}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.8,
    })),
    ...tips.map((t) => ({
      url: `${baseUrl}/tips/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

/** Ample Logistics' own sitemap — a different business line, not part of the Brand system. */
function logisticsSitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${LOGISTICS.domain}`;
  return ["", "/businesses", "/drivers", "/about", "/contact"].map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
}

// Must be dynamic — varies by Host header so each white-label domain gets
// its OWN sitemap instead of Ample Removals' (see brandSitemap() above).
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = headers().get("host");
  const clean = (host ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");

  if (clean === LOGISTICS.domain) return logisticsSitemap();

  const brand = brandForHost(host);
  if (brand !== AMPLE_BRAND) return brandSitemap(brand);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Local village pages (see localvillagesbuildingplan.md) — previously these
  // lived only in the orphaned locations-sitemap.xml, never actually wired
  // into the sitemap Google reads via robots.ts. Generated here instead.
  const villagePages: MetadataRoute.Sitemap = VILLAGES.flatMap((v) =>
    VILLAGE_SERVICES.map((service) => ({
      url: `${baseUrl}/${service}/${v.hubSlug}/${v.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  // Only Newbury and Thatcham — the two bespoke flagship pages — belong in
  // the sitemap. The other 30 /locations/[location] pages are thin,
  // near-duplicate templated content now marked noindex (see that page's
  // generateMetadata), so advertising them here would be contradictory and
  // could dilute perceived site quality.
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.filter(
    (loc) => loc.slug === "newbury" || loc.slug === "thatcham"
  ).map((loc) => ({
    url: `${baseUrl}/locations/${loc.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }));

  // Top-level service index pages — give the villages (3 levels deep) a
  // real, crawlable parent instead of being orphaned under /[service]/.
  const serviceIndexPages: MetadataRoute.Sitemap = VILLAGE_SERVICES.map((service) => ({
    url: `${baseUrl}/${service}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [
    ...villagePages,
    ...locationPages,
    ...serviceIndexPages,
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/booking/removals`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/booking/man-and-van`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/booking/house-clearance`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/booking/end-of-tenancy`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
