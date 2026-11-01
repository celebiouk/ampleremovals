import { BrandContactPage } from "@/components/local/multibrand/BrandContactPage";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata = brandPageMetadata(
  brand,
  "Contact Us | ManyVans",
  "Call, WhatsApp or email ManyVans directly — based at 20 Market Street, Newbury, RG14 5DP, covering Newbury and Thatcham.",
  "/contact"
);

export default function ManyVansContactPage() {
  return (
    <BrandContactPage
      brand={brand}
      logo={ManyVansLogo}
      quoteHref="/booking"
      whatsappMessage="Hi, I'd like to get in touch about a move (Newbury/Thatcham)."
    />
  );
}
