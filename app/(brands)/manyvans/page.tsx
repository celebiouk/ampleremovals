import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansRemovals } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata = brandPageMetadata(
  brand,
  "Removals in Newbury & Thatcham | ManyVans",
  "ManyVans — a full fleet of vans ready for any size house removal across Newbury and Thatcham. Fixed price, fully insured, 7+ years' moving experience. Get a free quote.",
  "/"
);

export default function ManyVansPage() {
  return <BrandPageShell brand={brand} logo={ManyVansLogo} content={manyVansRemovals} path="/" />;
}
