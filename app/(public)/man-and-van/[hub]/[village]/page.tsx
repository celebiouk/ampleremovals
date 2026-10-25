import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VILLAGES, VILLAGE_MAP } from "@/lib/villages";
import { HUB_MAP } from "@/lib/hubs";
import { pickVariant } from "@/lib/local-variants";
import { Truck, Clock, PoundSterling, CheckCircle2, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  return VILLAGES.map((v) => ({ hub: v.hubSlug, village: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ hub: string; village: string }> }): Promise<Metadata> {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) return { title: "Not found" };
  const hub = HUB_MAP[village.hubSlug];
  return {
    title: `Man and Van in ${village.name}, ${hub.name} (${village.postcode}) — Same-Day Quotes`,
    description: `Need a van and a crew in ${village.name} today or tomorrow? We're based ${hub.depotDistanceMiles} miles away near ${hub.landmark} — fast quotes, no call-out fee, ${village.postcode} covered.`,
    alternates: { canonical: `https://www.ampleremovals.com/man-and-van/${village.hubSlug}/${village.slug}` },
  };
}

const LOAD_SIZES = [
  { label: "A few boxes / one item", vans: "Small van, 1 man", example: "a sofa, a wardrobe, a few boxes for a student move" },
  { label: "A room's worth", vans: "Medium van, 1–2 men", example: "a bedroom or living room, eBay/Marketplace collections" },
  { label: "A small flat", vans: "Large van, 2 men", example: "a 1-bed flat move, light house clearance" },
];

// Several genuinely different ways to say the same underlying fact — picked
// deterministically per village so no two villages read the same sentence,
// not just the same sentence with a name swapped in (see lib/local-variants.ts).
const LOAD_INTROS = (v: string) => [
  `Most jobs around ${v} land in one of these three sizes — tell us which, and we'll quote on the spot.`,
  `Jobs we do in and around ${v} are almost always one of these three — pick the closest match to get a price fast.`,
  `No need to describe every item — in ${v} it's nearly always a quarter-van, half-van, or full-van job.`,
];

const TRUST_LINES = (hubName: string) => [
  ["Book today, move tomorrow — no 2-week wait", "Priced by load, not by the hour padded out", `Fully insured crew, every job in ${hubName}`],
  ["Same-week availability, most of the time", "One price, agreed before we load anything", `Our ${hubName} crew knows the roads, not just the postcode`],
  ["No call-out fee just to get a quote", "You only pay for the space your stuff fills", `Every job covered by goods-in-transit insurance`],
];

const FAQS = (village: { name: string; postcode: string }, hub: { depotDistanceMiles: number; name: string }) => [
  [
    { q: `Do you cover single-item collections in ${village.name}?`, a: `Yes — a lot of our ${village.name} jobs are one item: a sofa, a wardrobe, a Marketplace collection. No job's too small to quote.` },
    { q: `How quickly can you get a van to ${village.postcode}?`, a: `We're ${hub.depotDistanceMiles} miles from ${village.name}, so same-day or next-day is usually possible — call us and we'll tell you honestly if today's doable.` },
    { q: `Is there a minimum charge?`, a: `No — we quote on what you actually need moved, not a fixed minimum. A single item costs less than a full load.` },
  ],
  [
    { q: `Can two people move a sofa or wardrobe in ${village.name} without us?`, a: `Sometimes, but stairs and narrow doorways in ${village.name} catch people out — our crew brings the straps and know-how to avoid a damaged item or a damaged wall.` },
    { q: `What if I don't know the exact load size yet?`, a: `Send us a photo or a rough list and we'll tell you which size van it needs — no commitment until you're happy with the price.` },
    { q: `Do you charge extra for ${hub.name}-area addresses with tricky parking?`, a: `We build that into the quote upfront once you tell us the address, rather than surprise you with it on the day.` },
  ],
  [
    { q: `Can I book a man and van for the same day in ${village.name}?`, a: `Often, yes. Call us in the morning and we'll tell you straight away whether a crew's free for ${village.name} that day.` },
    { q: `Do you dismantle furniture if it won't fit through the door?`, a: `Yes, for an extra charge we'll dismantle and reassemble beds, wardrobes and tables on-site — just mention it when you book.` },
    { q: `What's included in the price?`, a: `The van, the crew, fuel, and careful loading/unloading at both ends. No hidden mileage charge once you're in ${hub.name}.` },
  ],
];

const CTA_HEADINGS = (v: string) => [
  `Ready for a quote on your ${v} job?`,
  `Get your ${v} van booked`,
  `Let's get your ${v} load moved`,
];

export default async function ManAndVanVillagePage({ params }: { params: Promise<{ hub: string; village: string }> }) {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) notFound();
  const hub = HUB_MAP[village.hubSlug];
  const siblings = village.nearbyVillages.map((s) => VILLAGE_MAP[s]).filter(Boolean);

  const loadIntro = pickVariant(village.slug, "man-van-intro", LOAD_INTROS(village.name));
  const trustLine = pickVariant(village.slug, "man-van-trust", TRUST_LINES(hub.name));
  const faqSet = pickVariant(village.slug, "man-van-faq", FAQS(village, hub));
  const ctaHeading = pickVariant(village.slug, "man-van-cta", CTA_HEADINGS(village.name));

  return (
    <div>
      {/* Hero — speed-led, green accent */}
      <section className="bg-gradient-to-br from-brand-green-700 to-brand-green-900 px-6 py-16 text-white">
        <div className="container mx-auto max-w-4xl">
          <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-brand-green-200">
            {village.postcode} · {hub.name}, {hub.county}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Man and Van in {village.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-green-100">{village.character}</p>
          <p className="mt-2 max-w-2xl text-brand-green-100">
            Our nearest crew is based {hub.depotDistanceMiles} miles away, near {hub.landmark} — so a van's usually in {village.name} faster than you'd think.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-brand-green-800 hover:bg-brand-green-50">
              <Link href="/booking/man-and-van">Get a quote <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <a href="tel:03335772070"><Phone className="h-4 w-4" /> 0333 577 2070</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Load-size module — unique to this service */}
      <section className="px-6 py-14">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">What's your load?</h2>
          <p className="mt-2 text-slate-600">{loadIntro}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {LOAD_SIZES.map((l) => (
              <div key={l.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Truck className="h-6 w-6 text-brand-green-600" />
                <p className="mt-3 font-semibold text-slate-900">{l.label}</p>
                <p className="mt-1 text-sm text-slate-500">{l.vans}</p>
                <p className="mt-2 text-sm text-slate-600">E.g. {l.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {village.accessNote && (
        <section className="bg-slate-50 px-6 py-10">
          <div className="container mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-900">Local to know: {village.name}</p>
            <p className="mt-2 text-slate-600">{village.accessNote}</p>
          </div>
        </section>
      )}

      {/* Trust line */}
      <section className="px-6 py-14">
        <div className="container mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {trustLine.map((line) => {
            const Icon = line === trustLine[0] ? Clock : line === trustLine[1] ? PoundSterling : CheckCircle2;
            return (
              <div key={line} className="flex items-start gap-3">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-brand-green-600" />
                <p className="text-sm text-slate-700">{line}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 px-6 py-14">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">Man and van in {village.name} — questions</h2>
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
            <p className="text-sm font-semibold text-slate-500">We also cover nearby:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/man-and-van/${s.hubSlug}/${s.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-purple-700 hover:bg-brand-purple-50">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-purple-900 px-6 py-14 text-center text-white">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold">{ctaHeading}</h2>
          <Button asChild size="lg" className="mt-6 bg-brand-green-600 hover:bg-brand-green-500">
            <Link href="/booking/man-and-van">Get your free quote <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
