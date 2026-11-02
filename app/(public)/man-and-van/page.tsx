import { Metadata } from "next";
import { ServiceIndexPage } from "@/components/local/ServiceIndexPage";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";

export const metadata: Metadata = {
  title: "Man and Van — Newbury, Thatcham & Across Berkshire, Hampshire & Beyond",
  description: "Flexible man and van hire, priced by the hour — one or two movers, loaded and driven properly. Based in Thatcham, covering Newbury and towns and villages across Berkshire, Hampshire, Oxfordshire and Wiltshire.",
  alternates: { canonical: "https://www.ampleremovals.com/man-and-van" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbSchema([
      { name: "Home", url: "https://www.ampleremovals.com" },
      { name: "Man and Van", url: "https://www.ampleremovals.com/man-and-van" },
    ]),
  ],
};

export default function ManAndVanIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServiceIndexPage
        service="man-and-van"
        title="Man and Van"
        heroHeadline="A Man and Van for Whatever You're Moving — Priced by the Hour"
        heroSub="One item or a full flat — flexible, hourly-priced man and van cover for your town or village, with a team that turns up on time and handles things properly."
        whatsappMessage="Hi, I need a man and van. Can you help?"
      />
    </>
  );
}
