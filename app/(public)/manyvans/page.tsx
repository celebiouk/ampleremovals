import type { Metadata } from "next";
import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ManyVansLogo } from "@/components/shared/logos/ManyVansLogo";
import { manyVansRemovals } from "@/lib/brand-page-content/manyvans";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];

export const metadata: Metadata = {
  title: "Removals in Newbury & Thatcham | ManyVans",
  description: "ManyVans — house removals covering both Newbury and Thatcham. Fixed price, fully insured, 7+ years' moving experience. Get a free quote.",
  alternates: { canonical: `https://${brand.domain}/` },
};

export default function ManyVansPage() {
  return <BrandPageShell brand={brand} logo={ManyVansLogo} content={manyVansRemovals} />;
}
