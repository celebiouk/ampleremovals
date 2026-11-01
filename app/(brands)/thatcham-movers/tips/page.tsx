import { BrandTipsIndexPage } from "@/components/local/multibrand/BrandTipsPages";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { thatchamMoversTips } from "@/lib/brand-page-content/thatcham-movers";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export const metadata = brandPageMetadata(
  brand,
  "Tips & Advice | Thatcham Movers",
  "Practical moving advice, price guides and checklists from Thatcham Movers — written by the crew that does the moving.",
  "/tips"
);

export default function ThatchamMoversTipsIndexPage() {
  return (
    <BrandTipsIndexPage
      brand={brand}
      logo={ThatchamMoversLogo}
      articles={thatchamMoversTips}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like a quote for a move in Thatcham."
    />
  );
}
