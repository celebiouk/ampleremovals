import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VILLAGES, VILLAGE_MAP } from "@/lib/villages";
import { HUB_MAP } from "@/lib/hubs";
import { pickVariant } from "@/lib/local-variants";
import { Sofa, Refrigerator, TreePine, Archive, FileCheck2, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstantHourlyQuoteWidget } from "@/components/local/InstantHourlyQuoteWidget";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { StickyQuoteBar } from "@/components/local/StickyQuoteBar";

// Garage clearances, shed clearances, loft clearances, garden waste, building
// waste, end-of-tenancy clearance, office clearance, rubbish clearance.
const CLEARANCE_STANDARD_RATE = 45; // £/hr, 1 man + van
const CLEARANCE_PREMIUM_RATE = 70; // £/hr, 2 men

export async function generateStaticParams() {
  return VILLAGES.map((v) => ({ hub: v.hubSlug, village: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ hub: string; village: string }> }): Promise<Metadata> {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) return { title: "Not found" };
  const hub = HUB_MAP[village.hubSlug];
  return {
    title: `House Clearance ${village.name} — Instant Price | £45–£70/hr`,
    description: `See your exact ${village.name} house clearance price in seconds — garages, lofts, probate, the lot. Licensed waste carrier, ${hub.depotDistanceMiles} miles away near ${hub.landmark}. No home visit required.`,
    alternates: { canonical: `https://www.ampleremovals.com/house-clearance/${village.hubSlug}/${village.slug}` },
  };
}

const HEADLINES = (v: string) => [
  `House Clearance in ${v} — Your Price Instantly, No Site Visit Needed`,
  `${v} House Clearance, Sorted Today — See Your Price Before You Call Anyone Else`,
  `Stop Dreading the Clear-Out. Get Your ${v} Price in Seconds, Booked in Minutes.`,
];

const SUBHEADS = (v: string) => [
  `Garages, sheds, lofts, gardens, building waste, end-of-tenancy, office and general rubbish — pick your hours below and watch your exact ${v} price appear. No home visit, no vague "we'll call you back."`,
  `Every quote-chasing clearance company makes you wait days for a number. We don't. Tell us the hours, see the price, and your ${v} clearance is booked — before you've finished your coffee.`,
  `A full house, a single loft, or just the shed — whatever's going, enter your hours and get your exact ${v} price on screen right now. No judgement, no rush, no waiting around for someone to call.`,
];

const CATEGORY_SETS = (v: string) => [
  [
    { icon: Sofa, label: "Furniture", body: "Sofas, beds, wardrobes, tables — any condition." },
    { icon: Refrigerator, label: "Appliances", body: "Fridges, washing machines, cookers — WEEE-compliant disposal." },
    { icon: TreePine, label: "Garden & outbuildings", body: "Sheds, greenhouses, garden waste, old fencing." },
    { icon: Archive, label: "Loft, garage, general", body: "Years of accumulated belongings, sorted and cleared." },
  ],
  [
    { icon: Sofa, label: "Household furniture", body: `From a single wardrobe to a full ${v} house of it.` },
    { icon: Refrigerator, label: "White goods & electricals", body: "Disposed of the proper way, not left for the council to find." },
    { icon: TreePine, label: "Outdoor spaces", body: "Garden furniture, sheds, overgrown clearances." },
    { icon: Archive, label: "The forgotten corners", body: "Attics, garages, under-stairs cupboards — the stuff nobody wants to tackle." },
  ],
  [
    { icon: Archive, label: "A lifetime of belongings", body: `Common on probate jobs around ${v} — we take our time with items that matter.` },
    { icon: Sofa, label: "Furniture of any size", body: "Large or small, upstairs or down — we handle the carrying." },
    { icon: Refrigerator, label: "Appliances, safely disposed", body: "Fridges and freezers degassed and recycled correctly, not dumped." },
    { icon: TreePine, label: "Gardens and outbuildings", body: "Sheds, greenhouses, years of garden clutter, all included." },
  ],
];

const PROOF_LINES = (v: string) => [
  `Everything we take from a ${v} property is disposed of or recycled properly — never fly-tipped. We'll tell you honestly what's going to charity, what's recyclable, and what genuinely has to go to waste.`,
  `We hold a full waste carrier's licence, and it shows in how we handle a ${v} clearance — proper sorting, proper disposal, a paper trail if you ever need one.`,
  `No corners cut on disposal just to clear a ${v} property faster. Reusable items go to charity where we can, everything else goes through licensed channels.`,
];

const FAQS = (village: { name: string }, hub: { depotDistanceMiles: number }) => [
  [
    { q: `We're dealing with a probate property — can you help?`, a: `Yes, a good amount of our ${village.name} work is probate clearances. We can work directly with solicitors/executors and take things at whatever pace is needed.` },
    { q: `Do you clear just one room, or does it have to be the whole house?`, a: `Either — a single loft or garage clear-out is just as fine as a full property.` },
    { q: `How quickly can you clear a ${village.name} property?`, a: `We're ${hub.depotDistanceMiles} miles away, so same-week is usually possible — same-day for smaller clearances.` },
  ],
  [
    { q: `Can you sort items for family members to keep before clearing?`, a: `Yes — tell us what needs setting aside and we'll work around it, no rush.` },
    { q: `Do you clear properties that are hard to access?`, a: `Usually, yes — overgrown gardens, cluttered hallways, blocked stairs. Tell us what we're dealing with and we'll plan for it.` },
    { q: `What happens to furniture that's still usable?`, a: `Where we can, it goes to local charities rather than landfill — we'll let you know what's been donated.` },
  ],
  [
    { q: `Can you give a fixed price before you arrive?`, a: `We can give a close estimate from photos or a description, with the final figure confirmed once we see the property.` },
    { q: `Is there anything you can't clear?`, a: `Hazardous materials like asbestos need a specialist — everything else, we can usually take.` },
    { q: `Do you clear for landlords between tenants?`, a: `Yes, that's a regular job for us around ${village.name} — quick turnaround so the property's ready to re-let.` },
  ],
];

const CTA_HEADINGS = (v: string) => [
  `Still putting off that ${v} clear-out? Get your price now — it's faster than deciding not to.`,
  `Your ${v} clearance price is one tap away. Why wait any longer?`,
  `Clear it, don't carry it any longer — get your ${v} price now.`,
];

export default async function HouseClearanceVillagePage({ params }: { params: Promise<{ hub: string; village: string }> }) {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) notFound();
  const hub = HUB_MAP[village.hubSlug];
  const siblings = village.nearbyVillages.map((s) => VILLAGE_MAP[s]).filter(Boolean);

  const headline = pickVariant(village.slug, "house-clearance-headline", HEADLINES(village.name));
  const subhead = pickVariant(village.slug, "house-clearance-subhead", SUBHEADS(village.name));
  const categories = pickVariant(village.slug, "house-clearance-categories", CATEGORY_SETS(village.name));
  const proofLine = pickVariant(village.slug, "house-clearance-proof", PROOF_LINES(village.name));
  const faqSet = pickVariant(village.slug, "house-clearance-faq", FAQS(village, hub));
  const ctaHeading = pickVariant(village.slug, "house-clearance-cta", CTA_HEADINGS(village.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: `Ample Removals — House Clearance, ${village.name}`,
        description: "Garage, shed, loft, garden, building waste, end-of-tenancy and office clearances.",
        areaServed: { "@type": "Place", name: `${village.name}, ${hub.county}`, address: { "@type": "PostalAddress", addressLocality: village.name, postalCode: village.postcode, addressRegion: hub.county, addressCountry: "GB" } },
        geo: { "@type": "GeoCoordinates", latitude: village.lat, longitude: village.lng },
        telephone: "+443335772070",
        priceRange: "££",
        url: `https://www.ampleremovals.com/house-clearance/${village.hubSlug}/${village.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqSet.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  const whatsappMessage = `Hi, I need to clear my property in ${village.name}, ${hub.name}. Can I send a photo and get a quote? (Page: https://www.ampleremovals.com/house-clearance/${village.hubSlug}/${village.slug})`;

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StickyQuoteBar quoteHref="#get-price" whatsappMessage={whatsappMessage} />
      {/* Hero — quieter, professional tone, slate+purple */}
      <section className="bg-slate-900 px-6 pb-16 pt-28 text-white lg:pt-36">
        <div className="container mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
          <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-slate-400">
            {village.name} · {village.postcode}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">{subhead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppButton message={whatsappMessage} />
              <a href="tel:03335772070" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-6 py-3 font-semibold text-white hover:bg-slate-800">
                <Phone className="h-4 w-4" /> Or call 0333 577 2070
              </a>
            </div>
          </div>
          <div id="get-price">
            <InstantHourlyQuoteWidget service="house_clearance" standardRate={CLEARANCE_STANDARD_RATE} premiumRate={CLEARANCE_PREMIUM_RATE} accent="purple" minHours={1} allowFixedPrice />
          </div>
        </div>
      </section>

      {/* What we clear — category grid, unique to this service */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">What we clear in {village.name}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <div key={c.label} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <c.icon className="h-6 w-6 shrink-0 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-900">{c.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Licensed waste carrier proof */}
      <section className="bg-slate-50 px-6 py-14">
        <div className="container mx-auto flex max-w-3xl items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
          <FileCheck2 className="mt-1 h-7 w-7 shrink-0 text-brand-purple-700" />
          <div>
            <p className="font-semibold text-slate-900">Fully licensed waste carrier</p>
            <p className="mt-1 text-slate-600">{proofLine}</p>
          </div>
        </div>
      </section>

      {village.accessNote && (
        <section className="px-6 py-10">
          <div className="container mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-900">Getting to {village.name}</p>
            <p className="mt-2 text-slate-600">{village.accessNote}</p>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">House clearance in {village.name} — questions</h2>
          <div className="mt-6 space-y-3">
            {faqSet.map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="px-6 py-10">
          <div className="container mx-auto max-w-4xl">
            <p className="text-sm font-semibold text-slate-500">Also serving nearby:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/house-clearance/${s.hubSlug}/${s.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-purple-700 hover:bg-brand-purple-50">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-brand-purple-900 px-6 py-14 text-center text-white">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold">{ctaHeading}</h2>
          <Button asChild size="lg" className="mt-6 bg-white text-brand-purple-900 hover:bg-slate-100">
            <a href="#get-price">Get my instant price <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>
      </section>
    </div>
  );
}
