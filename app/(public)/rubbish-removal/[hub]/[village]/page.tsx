import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VILLAGES, VILLAGE_MAP } from "@/lib/villages";
import { HUB_MAP } from "@/lib/hubs";
import { pickVariant } from "@/lib/local-variants";
import { Zap, Ban, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstantHourlyQuoteWidget } from "@/components/local/InstantHourlyQuoteWidget";

// Same hourly model as House Clearance — rubbish clearance is one of that
// service's own keyword targets, so the pricing must match, not contradict it.
const RUBBISH_STANDARD_RATE = 45; // £/hr, 1 man + van
const RUBBISH_PREMIUM_RATE = 70; // £/hr, 2 men

export async function generateStaticParams() {
  return VILLAGES.map((v) => ({ hub: v.hubSlug, village: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ hub: string; village: string }> }): Promise<Metadata> {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) return { title: "Not found" };
  return {
    title: `Rubbish Removal ${village.name} — Instant Price, Same-Day | £45–£70/hr`,
    description: `See your exact ${village.name} rubbish removal price in seconds — no skip permit, no council wait. Enter your hours, pay a small deposit, it's gone. ${village.postcode} covered, often same-day.`,
    alternates: { canonical: `https://www.ampleremovals.com/rubbish-removal/${village.hubSlug}/${village.slug}` },
  };
}

const HEADLINES = (v: string) => [
  `Rubbish Gone From ${v} — Your Price in Seconds, Not a Skip Permit in Sight`,
  `${v} Rubbish Removal, Sorted Today — See Your Price Before You Even Book a Skip`,
  `Stop Living Around That Pile. Get Your ${v} Price Now, Gone This Week.`,
];

const HERO_SUBS = (v: string) => [
  `No skip permit, no council wait, no lugging it to the tip yourself. Pick your hours below, see your exact ${v} price, and we turn up and point-and-load it straight into the van.`,
  `Skip hire means a permit, a wait, and a skip sitting outside for days. Enter your hours, see your ${v} price instantly, and we're in and out the same day — nothing left behind.`,
  `Quicker than booking a skip, cheaper than a tip run in a hired van. Choose your hours, watch the price appear, lock in your slot — done in under two minutes.`,
];

const WE_TAKE_SETS = [
  ["Furniture", "Mattresses", "Garden waste", "Old appliances", "General household junk", "Builders' waste (small amounts)"],
  ["Sofas and beds", "Fridges, washers, old white goods", "Shed and garden clear-outs", "Boxes of general clutter", "Broken or unwanted furniture", "Small amounts of rubble or offcuts"],
  ["Anything too big for your bin", "Mattresses and bed frames", "Garden rubbish and cuttings", "Old electricals", "Household junk you've been putting off", "Light trade waste"],
];
const CANT_TAKE_SETS = [
  ["Asbestos", "Gas canisters", "Hazardous chemicals", "Paint tins (part-full)"],
  ["Asbestos sheeting", "Pressurised canisters", "Chemical waste", "Part-used paint or solvents"],
];

const FAQS = (village: { name: string; postcode: string }, hub: { depotDistanceMiles: number }) => [
  [
    { q: `Is this cheaper than a skip?`, a: `For most ${village.name} jobs, yes — no permit fee, no waiting for collection, and you're only charged for the hours it actually takes.` },
    { q: `Do I need to sort it before you arrive?`, a: `No — just point at what's going. We'll sort out what can be recycled.` },
    { q: `Can you come the same day?`, a: `Often, yes — we're ${hub.depotDistanceMiles} miles from ${village.name}. Call and we'll tell you straight away if today's possible.` },
  ],
  [
    { q: `How is the price worked out?`, a: `It's priced by the hour — £${RUBBISH_STANDARD_RATE}/hr for one man and a van, or £${RUBBISH_PREMIUM_RATE}/hr for two men if there's more to shift. You pick hours, see the total instantly.` },
    { q: `What if I'm not sure how many hours I'll need?`, a: `Our instant quote above gives you a starting point — if it runs over, we'll tell you honestly rather than surprise you afterwards.` },
    { q: `Do you take stuff from the garden as well as the house?`, a: `Yes — garden waste, old fencing, shed clear-outs, all in the same booking.` },
  ],
  [
    { q: `Will you take it from inside the house, or just the kerb?`, a: `From wherever it's sitting — loft, garage, back garden. You don't need to drag it outside first.` },
    { q: `Is there a call-out charge if I change my mind?`, a: `No — a small deposit secures your slot, and the rest is only for the hours worked.` },
    { q: `What's your coverage area around ${village.postcode}?`, a: `We cover ${village.name} and the villages listed near it below — just ask if you're unsure.` },
  ],
];

const CTA_HEADINGS = (v: string) => [
  `That rubbish isn't going anywhere on its own. Get your ${v} price now.`,
  `Still tripping over it? Your ${v} price is 30 seconds away.`,
  `Book it gone from ${v} today — see your price first, no obligation.`,
];

export default async function RubbishRemovalVillagePage({ params }: { params: Promise<{ hub: string; village: string }> }) {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) notFound();
  const hub = HUB_MAP[village.hubSlug];
  const siblings = village.nearbyVillages.map((s) => VILLAGE_MAP[s]).filter(Boolean);

  const headline = pickVariant(village.slug, "rubbish-headline", HEADLINES(village.name));
  const heroSub = pickVariant(village.slug, "rubbish-hero", HERO_SUBS(village.name));
  const faqSet = pickVariant(village.slug, "rubbish-faq", FAQS(village, hub));
  const ctaHeading = pickVariant(village.slug, "rubbish-cta", CTA_HEADINGS(village.name));
  const weTake = pickVariant(village.slug, "rubbish-we-take", WE_TAKE_SETS);
  const cantTake = pickVariant(village.slug, "rubbish-cant-take", CANT_TAKE_SETS);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: `Ample Removals — Rubbish Removal, ${village.name}`,
        areaServed: { "@type": "Place", name: `${village.name}, ${hub.county}`, address: { "@type": "PostalAddress", addressLocality: village.name, postalCode: village.postcode, addressRegion: hub.county, addressCountry: "GB" } },
        geo: { "@type": "GeoCoordinates", latitude: village.lat, longitude: village.lng },
        telephone: "+443335772070",
        priceRange: "££",
        url: `https://www.ampleremovals.com/rubbish-removal/${village.hubSlug}/${village.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqSet.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero — bold, punchy, price-led */}
      <section className="bg-brand-green-600 px-6 pb-16 pt-28 text-white lg:pt-36">
        <div className="container mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              {headline}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-brand-green-50">{heroSub}</p>
            <p className="mt-2 text-sm font-semibold text-brand-green-100">{village.postcode} · {village.name}, {hub.county}</p>
            <a href="tel:03335772070" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
              <Phone className="h-4 w-4" /> Or call 0333 577 2070
            </a>
          </div>
          <div id="get-price">
            <InstantHourlyQuoteWidget service="house_clearance" standardRate={RUBBISH_STANDARD_RATE} premiumRate={RUBBISH_PREMIUM_RATE} accent="green" />
          </div>
        </div>
      </section>

      {/* What we take / can't take */}
      <section className="px-6 py-16">
        <div className="container mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 text-brand-green-700"><Zap className="h-5 w-5" /><p className="font-semibold">We take</p></div>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {weTake.map((i) => <li key={i}>• {i}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 text-slate-500"><Ban className="h-5 w-5" /><p className="font-semibold">Can't take</p></div>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {cantTake.map((i) => <li key={i}>• {i}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {village.accessNote && (
        <section className="bg-slate-50 px-6 py-10">
          <div className="container mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-900">Worth knowing in {village.name}:</p>
            <p className="mt-2 text-slate-600">{village.accessNote}</p>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">Rubbish removal in {village.name}</h2>
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
        <section className="bg-slate-50 px-6 py-10">
          <div className="container mx-auto max-w-4xl">
            <p className="text-sm font-semibold text-slate-500">Also clearing rubbish near:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/rubbish-removal/${s.hubSlug}/${s.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-green-700 hover:bg-brand-green-50">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-slate-900 px-6 py-14 text-center text-white">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold">{ctaHeading}</h2>
          <p className="mt-2 text-slate-300">Pick your hours, see your price, pay a small deposit — done in under two minutes.</p>
          <Button asChild size="lg" className="mt-6 bg-brand-green-600 hover:bg-brand-green-500">
            <a href="#get-price">Get my instant price <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>
      </section>
    </div>
  );
}
