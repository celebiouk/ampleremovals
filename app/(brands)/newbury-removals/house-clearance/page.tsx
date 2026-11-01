import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { newburyRemovalsHouseClearance } from "@/lib/brand-page-content/newbury-removals";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export const metadata = brandPageMetadata(
  brand,
  "House Clearance in Newbury | Newbury Removals",
  "House clearance in Newbury with a fixed price from photos. Probate, rental turnarounds, downsizing. Responsible disposal, fully insured.",
  "/house-clearance"
);

export default function NewburyRemovalsHouseClearancePage() {
  return <BrandPageShell brand={brand} logo={NewburyRemovalsLogo} content={newburyRemovalsHouseClearance} />;
}
