import type { Metadata } from "next";
import { LandingBooking } from "@/components/landing/LandingBooking";
import { getCurrentBrand } from "@/lib/brand-context";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getCurrentBrand();
  return {
    title: `Get Your Instant Removals Quote — ${brand.name}`,
    description:
      "Moving home? Get a fixed, no-obligation price in under 60 seconds. Trusted, fully-insured removals crews. No hidden fees.",
    robots: { index: false, follow: false }, // ad landing page — keep it out of search
  };
}

export default async function BookingLandingPage() {
  const brand = await getCurrentBrand();
  return <LandingBooking brand={brand} />;
}
