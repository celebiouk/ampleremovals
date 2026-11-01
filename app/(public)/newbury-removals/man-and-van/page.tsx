import type { Metadata } from "next";
import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { newburyRemovalsManAndVan } from "@/lib/brand-page-content/newbury-removals";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export const metadata: Metadata = {
  title: "Man and Van in Newbury | Newbury Removals",
  description: "Man and Van in Newbury from £45/hr. One or two movers and a van, 2-hour minimum, fully insured. Get an instant quote.",
  alternates: { canonical: `https://${brand.domain}/man-and-van` },
};

export default function NewburyRemovalsManAndVanPage() {
  return <BrandPageShell brand={brand} logo={NewburyRemovalsLogo} content={newburyRemovalsManAndVan} />;
}
