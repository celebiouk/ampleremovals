import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { thatchamMoversRubbishRemoval } from "@/lib/brand-page-content/thatcham-movers";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export const metadata = brandPageMetadata(
  brand,
  "Rubbish Removal in Thatcham | Thatcham Movers",
  "Rubbish removal in Thatcham, priced by the hour — garden waste, old furniture, garage clear-outs. Instant price, responsible disposal, fully insured.",
  "/rubbish-removal"
);

export default function ThatchamMoversRubbishRemovalPage() {
  return <BrandPageShell brand={brand} logo={ThatchamMoversLogo} content={thatchamMoversRubbishRemoval} path="/rubbish-removal" />;
}
