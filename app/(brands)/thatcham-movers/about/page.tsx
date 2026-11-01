import { BrandAboutPage } from "@/components/local/multibrand/BrandAboutPage";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { thatchamMoversAbout } from "@/lib/brand-page-content/thatcham-movers";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export const metadata = brandPageMetadata(
  brand,
  "About Us | Thatcham Movers",
  "Thatcham Movers — a local removal company based at 17 Thatcham Broadway, backed by 7+ years' moving experience.",
  "/about"
);

export default function ThatchamMoversAboutPage() {
  return <BrandAboutPage brand={brand} logo={ThatchamMoversLogo} content={thatchamMoversAbout} />;
}
