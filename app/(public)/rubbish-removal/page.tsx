import { Metadata } from "next";
import { ServiceIndexPage } from "@/components/local/ServiceIndexPage";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  title: "Rubbish Removal — Newbury, Thatcham & Across Berkshire, Hampshire & Beyond",
  description: "Fast rubbish and waste clearance, priced by the hour — send a photo, get a price. Based in Thatcham, covering Newbury and towns and villages across Berkshire, Hampshire, Oxfordshire and Wiltshire.",
  alternates: { canonical: "https://www.ampleremovals.com/rubbish-removal" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbSchema([
      { name: "Home", url: "https://www.ampleremovals.com" },
      { name: "Rubbish Removal", url: "https://www.ampleremovals.com/rubbish-removal" },
    ]),
  ],
};

export default function RubbishRemovalIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServiceIndexPage
        service="rubbish-removal"
        title="Rubbish Removal"
        heroHeadline="Rubbish Gone Today — Send a Photo, Get a Price, Book It"
        heroSub="Fast, hourly-priced rubbish and waste clearance for your town or village — no skip hire, no waiting days for someone to turn up."
        whatsappMessage="Hi, I have rubbish to remove. Can I send a photo and get a quote?"
      />
    </>
  );
}
