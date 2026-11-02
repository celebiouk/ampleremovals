import { Metadata } from "next";
import { ServiceIndexPage } from "@/components/local/ServiceIndexPage";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  title: "House Clearance — Newbury, Thatcham & Across Berkshire, Hampshire & Beyond",
  description: "Garage, shed, loft, garden, building waste, end-of-tenancy and office clearances — priced by the hour. Based in Thatcham, covering Newbury and towns and villages across Berkshire, Hampshire, Oxfordshire and Wiltshire.",
  alternates: { canonical: "https://www.ampleremovals.com/house-clearance" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbSchema([
      { name: "Home", url: "https://www.ampleremovals.com" },
      { name: "House Clearance", url: "https://www.ampleremovals.com/house-clearance" },
    ]),
  ],
};

export default function HouseClearanceIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServiceIndexPage
        service="house-clearance"
        title="House Clearance"
        heroHeadline="Garage, Loft or Whole House — Cleared Properly, Priced by the Hour"
        heroSub="Garage, shed, loft, garden, building waste, end-of-tenancy and office clearances for your town or village — a proper team, not just a skip dropped on the drive."
        whatsappMessage="Hi, I need a house clearance. Can I send a photo and get a quote?"
      />
    </>
  );
}
