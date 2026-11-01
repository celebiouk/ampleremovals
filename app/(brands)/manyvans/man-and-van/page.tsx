import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansManAndVan } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata = brandPageMetadata(
  brand,
  "Man and Van in Newbury & Thatcham | ManyVans",
  "Man and Van covering Newbury and Thatcham, from £45/hr. One or two movers and a van, 2-hour minimum, fully insured.",
  "/man-and-van"
);

export default function ManyVansManAndVanPage() {
  return <BrandPageShell brand={brand} logo={ManyVansLogo} content={manyVansManAndVan} />;
}
