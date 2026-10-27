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

  // The original 32 location pages — never wired into the sitemap at all
  // previously. Newbury and Thatcham get the top priority on the whole
  // site: they're the two bespoke, long-form flagship pages (see
  // components/local/flagship) built around the real Thatcham office.
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.map((loc) => ({
    url: `${baseUrl}/locations/${loc.slug}`,
    lastModified: new Date(),
    changeFrequency: loc.slug === "newbury" || loc.slug === "thatcham" ? "weekly" : "monthly",
    priority: loc.slug === "newbury" || loc.slug === "thatcham" ? 1 : 0.65,
  }));

  return [
    ...villagePages,
    ...locationPages,
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
