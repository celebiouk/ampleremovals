import { MetadataRoute } from "next";
import { VILLAGES } from "@/lib/villages";
import { LOCATIONS } from "@/lib/locations";

const VILLAGE_SERVICES = ["man-and-van", "house-removals", "house-clearance", "rubbish-removal"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
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
