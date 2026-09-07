import type { Metadata } from "next";
import { LandingBooking } from "@/components/landing/LandingBooking";

export const metadata: Metadata = {
  title: "Get Your Instant Removals Quote — Ample Removals",
  description:
    "Moving home? Get a fixed, no-obligation price in under 60 seconds. Trusted, fully-insured removals crews. No hidden fees.",
  robots: { index: false, follow: false }, // ad landing page — keep it out of search
};

export default function BookingLandingPage() {
  return <LandingBooking />;
}
