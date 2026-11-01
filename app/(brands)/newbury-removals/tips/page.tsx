import { BrandTipsIndexPage } from "@/components/local/multibrand/BrandTipsPages";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { newburyRemovalsTips } from "@/lib/brand-page-content/newbury-removals";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export const metadata = brandPageMetadata(
  brand,
  "Tips & Advice | Newbury Removals",
  "Practical moving advice, price guides and checklists from Newbury Removals — written by the crew that does the moving.",
  "/tips"
);

export default function NewburyRemovalsTipsIndexPage() {
  return (
    <BrandTipsIndexPage
      brand={brand}
      logo={NewburyRemovalsLogo}
      articles={newburyRemovalsTips}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like a quote for a move in Newbury."
    />
  );
}
