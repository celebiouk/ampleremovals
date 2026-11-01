import type { Metadata } from "next";
import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansHouseClearance } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata: Metadata = {
  title: "House Clearance in Newbury & Thatcham | ManyVans",
  description: "House clearance covering Newbury and Thatcham with a fixed price from photos. Probate, rental turnarounds, downsizing. Fully insured.",
  alternates: { canonical: `https://${brand.domain}/house-clearance` },
};

export default function ManyVansHouseClearancePage() {
  return <BrandPageShell brand={brand} logo={ManyVansLogo} content={manyVansHouseClearance} />;
}
