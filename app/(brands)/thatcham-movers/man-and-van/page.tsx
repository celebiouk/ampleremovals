import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { thatchamMoversManAndVan } from "@/lib/brand-page-content/thatcham-movers";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export const metadata = brandPageMetadata(
  brand,
  "Man and Van in Thatcham | Thatcham Movers",
  "Man and Van in Thatcham from £45/hr. One or two movers and a van, 2-hour minimum, fully insured. Get an instant quote.",
  "/man-and-van"
);

export default function ThatchamMoversManAndVanPage() {
  return <BrandPageShell brand={brand} logo={ThatchamMoversLogo} content={thatchamMoversManAndVan} path="/man-and-van" />;
}
