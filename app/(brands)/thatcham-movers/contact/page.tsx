import { BrandContactPage } from "@/components/local/multibrand/BrandContactPage";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export const metadata = brandPageMetadata(
  brand,
  "Contact Us | Thatcham Movers",
  "Call, WhatsApp or email Thatcham Movers directly — based at 17 Thatcham Broadway, RG19 3HX.",
  "/contact"
);

export default function ThatchamMoversContactPage() {
  return (
    <BrandContactPage
      brand={brand}
      logo={ThatchamMoversLogo}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like to get in touch about a move in Thatcham."
    />
  );
}
