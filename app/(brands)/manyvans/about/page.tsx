import { BrandAboutPage } from "@/components/local/multibrand/BrandAboutPage";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansAbout } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata = brandPageMetadata(
  brand,
  "About Us | ManyVans",
  "ManyVans — covering removals, man and van and house clearance across both Newbury and Thatcham, backed by 7+ years' experience.",
  "/about"
);

export default function ManyVansAboutPage() {
  return <BrandAboutPage brand={brand} logo={ManyVansLogo} content={manyVansAbout} />;
}
