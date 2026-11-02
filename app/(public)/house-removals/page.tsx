import { Metadata } from "next";
import { ServiceIndexPage } from "@/components/local/ServiceIndexPage";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  title: "House Removals — Newbury, Thatcham & Across Berkshire, Hampshire & Beyond",
  description: "Full house removals, priced instantly — Standard or Premium, deposit now, balance later. Based in Thatcham, covering Newbury and towns and villages across Berkshire, Hampshire, Oxfordshire and Wiltshire.",
  alternates: { canonical: "https://www.ampleremovals.com/house-removals" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbSchema([
      { name: "Home", url: "https://www.ampleremovals.com" },
      { name: "House Removals", url: "https://www.ampleremovals.com/house-removals" },
    ]),
  ],
};

export default function HouseRemovalsIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServiceIndexPage
        service="house-removals"
        title="House Removals"
        heroHeadline="Your Whole Home, Moved Properly — Priced Instantly, Wherever You Are"
        heroSub="Standard or Premium, deposit now and balance later — see your exact price for your town or village before you call anyone else."
        whatsappMessage="Hi, I'm looking to book a house removal. Can you help?"
      />
    </>
  );
}
