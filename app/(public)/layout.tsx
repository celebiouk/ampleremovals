import { Suspense } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Pixels } from "@/components/analytics/Pixels";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { SOCIAL_LINKS, OPENING_HOURS_SPEC, SEO_KEYWORDS } from "@/lib/company";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ampleremovals.com";
  // SEO: MovingCompany structured data — opening hours, social profiles, services.
  // Lives here (Ample's own route group), not the root layout, since the root
  // also wraps the white-label brand pages, which emit their own schema.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MovingCompany",
    name: "Ample Removals",
    description:
      "Professional home removals, man and van, business & commercial moves and long distance removals across the UK.",
    url: site,
    telephone: "+443335772070",
    email: "hello@ampleremovals.com",
    image: `${site}/og-image.png`,
    areaServed: "United Kingdom",
    priceRange: "££",
    sameAs: [SOCIAL_LINKS.facebook, SOCIAL_LINKS.tiktok],
    openingHoursSpecification: OPENING_HOURS_SPEC,
    knowsAbout: SEO_KEYWORDS,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Pixels />
      <AttributionCapture />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
