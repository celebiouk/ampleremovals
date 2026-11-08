import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansRubbishRemoval } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata = brandPageMetadata(
  brand,
  "Rubbish Removal in Newbury & Thatcham | ManyVans",
  "Rubbish removal across Newbury and Thatcham, priced by the hour — garden waste, old furniture, garage clear-outs. Instant price, fully insured.",
  "/rubbish-removal"
);

export default function ManyVansRubbishRemovalPage() {
  return <BrandPageShell brand={brand} logo={ManyVansLogo} content={manyVansRubbishRemoval} path="/rubbish-removal" />;
}
