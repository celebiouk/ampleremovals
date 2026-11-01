import type { Metadata } from "next";
import { BrandPageShell } from "@/components/local/multibrand/BrandPageShell";
import { ThatchamMoversLogo } from "@/components/shared/logos/ThatchamMoversLogo";
import { thatchamMoversRemovals } from "@/lib/brand-page-content/thatcham-movers";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];

export const metadata: Metadata = {
  title: "Removals in Thatcham | Thatcham Movers",
  description: "Thatcham Movers — local house removals based at 17 Thatcham Broadway. Fixed price, fully insured, 7+ years' moving experience. Get a free quote.",
  alternates: { canonical: `https://${brand.domain}/` },
};

export default function ThatchamMoversPage() {
  return <BrandPageShell brand={brand} logo={ThatchamMoversLogo} content={thatchamMoversRemovals} />;
}
