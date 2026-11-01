import { BrandContactPage } from "@/components/local/multibrand/BrandContactPage";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export const metadata = brandPageMetadata(
  brand,
  "Contact Us | Newbury Removals",
  "Call, WhatsApp or email Newbury Removals directly — based at 4 Market Place, Newbury, RG14 5BD.",
  "/contact"
);

export default function NewburyRemovalsContactPage() {
  return (
    <BrandContactPage
      brand={brand}
      logo={NewburyRemovalsLogo}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like to get in touch about a move in Newbury."
    />
  );
}
