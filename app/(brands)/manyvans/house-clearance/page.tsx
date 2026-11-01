import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansHouseClearance } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata = brandPageMetadata(
  brand,
  "House Clearance in Newbury & Thatcham | ManyVans",
  "House clearance covering Newbury and Thatcham with a fixed price from photos. Probate, rental turnarounds, downsizing. Fully insured.",
  "/house-clearance"
);

export default function ManyVansHouseClearancePage() {
  return <BrandPageShell brand={brand} logo={ManyVansLogo} content={manyVansHouseClearance} />;
}
