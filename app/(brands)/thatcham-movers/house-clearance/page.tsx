import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { thatchamMoversHouseClearance } from "@/lib/brand-page-content/thatcham-movers";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export const metadata = brandPageMetadata(
  brand,
  "House Clearance in Thatcham | Thatcham Movers",
  "House clearance in Thatcham with a fixed price from photos. Probate, rental turnarounds, downsizing. Responsible disposal, fully insured.",
  "/house-clearance"
);

export default function ThatchamMoversHouseClearancePage() {
  return <BrandPageShell brand={brand} logo={ThatchamMoversLogo} content={thatchamMoversHouseClearance} />;
}
