import type { Metadata } from "next";
import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { NewburyRemovalsLogo } from "@/components/shared/logos/NewburyRemovalsLogo";
import { newburyRemovalsRemovals } from "@/lib/brand-page-content/newbury-removals";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];

export const metadata: Metadata = {
  title: "Removals in Newbury | Newbury Removals",
  description: "Newbury Removals — local house removals based at 4 Market Place, Newbury. Fixed price, fully insured, 7+ years' moving experience. Get a free quote.",
  alternates: { canonical: `https://${brand.domain}/` },
};

export default function NewburyRemovalsPage() {
  return <BrandPageShell brand={brand} logo={NewburyRemovalsLogo} content={newburyRemovalsRemovals} />;
}
