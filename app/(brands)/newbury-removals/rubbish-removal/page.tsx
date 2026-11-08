import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { newburyRemovalsRubbishRemoval } from "@/lib/brand-page-content/newbury-removals";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export const metadata = brandPageMetadata(
  brand,
  "Rubbish Removal in Newbury | Newbury Removals",
  "Rubbish removal in Newbury, priced by the hour — garden waste, old furniture, garage clear-outs. Instant price, responsible disposal, fully insured.",
  "/rubbish-removal"
);

export default function NewburyRemovalsRubbishRemovalPage() {
  return <BrandPageShell brand={brand} logo={NewburyRemovalsLogo} content={newburyRemovalsRubbishRemoval} path="/rubbish-removal" />;
}
