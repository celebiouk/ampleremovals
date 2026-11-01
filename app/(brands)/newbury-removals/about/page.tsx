import { BrandAboutPage } from "@/components/local/multibrand/BrandAboutPage";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { newburyRemovalsAbout } from "@/lib/brand-page-content/newbury-removals";
import { BRAND_BY_SLUG, brandPageMetadata } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export const metadata = brandPageMetadata(
  brand,
  "About Us | Newbury Removals",
  "Newbury Removals — a local removal company based at 4 Market Place, Newbury, backed by 7+ years' moving experience.",
  "/about"
);

export default function NewburyRemovalsAboutPage() {
  return <BrandAboutPage brand={brand} logo={NewburyRemovalsLogo} content={newburyRemovalsAbout} />;
}
