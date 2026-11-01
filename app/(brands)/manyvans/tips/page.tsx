import { BrandTipsIndexPage } from "@/components/local/multibrand/BrandTipsPages";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansTips } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata = brandPageMetadata(
  brand,
  "Tips & Advice | ManyVans",
  "Practical moving advice, price guides and checklists from ManyVans — covering both Newbury and Thatcham.",
  "/tips"
);

export default function ManyVansTipsIndexPage() {
  return (
    <BrandTipsIndexPage
      brand={brand}
      logo={ManyVansLogo}
      articles={manyVansTips}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like a quote for a move (Newbury/Thatcham)."
    />
  );
}
