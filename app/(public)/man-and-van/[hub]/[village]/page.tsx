import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VILLAGES, VILLAGE_MAP } from "@/lib/villages";
import { HUB_MAP } from "@/lib/hubs";
import { pickVariant } from "@/lib/local-variants";
import { Truck, Clock, PoundSterling, CheckCircle2, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { StickyQuoteBar } from "@/components/local/StickyQuoteBar";

export async function generateStaticParams() {
  return VILLAGES.map((v) => ({ hub: v.hubSlug, village: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ hub: string; village: string }> }): Promise<Metadata> {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) return { title: "Not found" };
  const hub = HUB_MAP[village.hubSlug];
  return {
    title: `Man and Van ${village.name} — Instant Price, Same-Day Availability | £45/hr`,
    description: `Get your exact ${village.name} man and van price in 60 seconds — no callback, no call-out fee. ${hub.depotDistanceMiles} miles from our depot near ${hub.landmark}. ${village.postcode} covered, often same-day.`,
    alternates: { canonical: `https://www.ampleremovals.com/man-and-van/${village.hubSlug}/${village.slug}` },
  };
}

const LOAD_SIZES = [
  { label: "A few boxes / one item", vans: "Small van, 1 man", example: "a sofa, a wardrobe, a few boxes for a student move" },
  { label: "A room's worth", vans: "Medium van, 1–2 men", example: "a bedroom or living room, eBay/Marketplace collections" },
  { label: "A small flat", vans: "Large van, 2 men", example: "a 1-bed flat move, light house clearance" },
];

const HEADLINES = (v: string) => [
  `Man and Van in ${v} — Your Price in Seconds, Not Days`,
  `${v} Man and Van, Booked Today — See Your Price Before You Pick Up the Phone`,
  `The Man and Van ${v} Actually Trusts — Instant Price, No Waiting Around`,
  `Need a Van in ${v}? Get Your Exact Price Before You've Finished Your Coffee`,
  `${v}'s Man and Van, Priced Honestly — No Quote-Chasing, No Callbacks`,
  `Man and Van, ${v} — One Man, One Van, One Honest Price`,
];

const SUBHEADS = (v: string, miles: number, landmark: string) => [
  `No more chasing van companies for a quote that doesn't add up. Enter your hours below, watch your exact ${v} price appear, and lock in your date with a small deposit — right now.`,
  `Most man-and-van outfits make you wait for a callback that never quite comes. We're ${miles} miles away near ${landmark} — pick your hours, see your price instantly, and your ${v} slot's booked before the kettle's boiled.`,
  `Forget "we'll get back to you." Pick your hours, see your exact ${v} price, and secure your slot today — the whole thing takes under two minutes.`,
  `Tired of three different quotes for the same ${v} job? Pick your hours below and see the actual number — not an estimate that changes on the day.`,
  `We're ${miles} miles from ${v}, near ${landmark} — close enough that a van's usually on your street faster than a national firm could even call you back.`,
  `No site visit, no "we'll email you a quote" — just pick your hours, see your ${v} price, and book.`,
];

// Several genuinely different ways to say the same underlying fact — picked
// deterministically per village so no two villages read the same sentence,
// not just the same sentence with a name swapped in (see lib/local-variants.ts).
const LOAD_INTROS = (v: string) => [
  `Most jobs around ${v} land in one of these three sizes — tell us which, and we'll quote on the spot.`,
  `Jobs we do in and around ${v} are almost always one of these three — pick the closest match to get a price fast.`,
  `No need to describe every item — in ${v} it's nearly always a quarter-van, half-van, or full-van job.`,
  `Not sure how to describe your load? Most ${v} customers fit into one of these three without much thought.`,
  `Here's roughly what a ${v} job looks like, size-wise — pick the closest match and we'll take it from there.`,
];

const TRUST_LINES = (hubName: string) => [
  ["Book today, move tomorrow — no 2-week wait for a slot", "You see the exact price before you pay a penny", `Fully insured crew, every single job in ${hubName}`],
  ["Same-week availability, most weeks", "One agreed price — nothing added once we're loading", `Our ${hubName} crew knows the roads, not just the postcode`],
  ["No call-out fee just to find out what it costs", "You only pay for the hours you actually book", `Every job covered by goods-in-transit insurance`],
  ["No waiting days for a callback that never comes", "Nothing added once the van's loaded — the price you saw is the price you pay", `Local crew who actually know ${hubName}, not a dispatcher reading a postcode`],
  ["Same-day slots most weeks, not a 2-week queue", "Pay for the hours you book, nothing more", `Fully insured on every single ${hubName} job, no exceptions`],
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
  [
    { q: `Is the price you quote in ${village.name} actually final?`, a: `Yes — the hourly rate you see on screen is exactly what you pay for the hours booked, nothing added once we're loading.` },
    { q: `Can you move things between two ${village.name} addresses, like a garage to a house?`, a: `Yes — any two points in or around ${village.name}, not just a full house move.` },
    { q: `What if my job in ${village.name} runs over the hours I booked?`, a: `We'll tell you honestly as we get close, so there's no surprise — you can top up on the day if needed.` },
  ],
  [
    { q: `Do you need much notice for a ${village.name} job?`, a: `Not usually — same-week, sometimes same-day, is realistic depending on the crew's schedule that day.` },
    { q: `Can two men handle a bigger load in ${village.name}?`, a: `Yes, we can send two men and a larger van for bigger jobs — just let us know the size when you book.` },
    { q: `Do you cover student moves in ${village.name}?`, a: `Regularly — end-of-term and start-of-term are some of our busiest weeks for exactly that.` },
  ],
];

const CTA_HEADINGS = (v: string) => [
  `Still "thinking about it"? Get your ${v} price now — it takes less time than reading this.`,
  `Your ${v} van is one tap away — see the price, lock in the date.`,
  `Don't let ${v} moving day sneak up on you. Price it now, book in minutes.`,
  `Stop comparing quotes for your ${v} job — see the real number and book it.`,
  `Your ${v} price is already calculated. All that's left is booking it.`,
  `One tap, one honest price — get your ${v} van sorted now.`,
];

export default async function ManAndVanVillagePage({ params }: { params: Promise<{ hub: string; village: string }> }) {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) notFound();
  const hub = HUB_MAP[village.hubSlug];
  const siblings = village.nearbyVillages.map((s) => VILLAGE_MAP[s]).filter(Boolean);

  const headline = pickVariant(village.slug, "man-van-headline", HEADLINES(village.name));
  const subhead = pickVariant(village.slug, "man-van-subhead", SUBHEADS(village.name, hub.depotDistanceMiles, hub.landmark));
  const loadIntro = pickVariant(village.slug, "man-van-intro", LOAD_INTROS(village.name));
  const trustLine = pickVariant(village.slug, "man-van-trust", TRUST_LINES(hub.name));
  const faqSet = pickVariant(village.slug, "man-van-faq", FAQS(village, hub));
  const ctaHeading = pickVariant(village.slug, "man-van-cta", CTA_HEADINGS(village.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: `Ample Removals — Man and Van, ${village.name}`,
        areaServed: { "@type": "Place", name: `${village.name}, ${hub.county}`, address: { "@type": "PostalAddress", addressLocality: village.name, postalCode: village.postcode, addressRegion: hub.county, addressCountry: "GB" } },
        geo: { "@type": "GeoCoordinates", latitude: village.lat, longitude: village.lng },
        telephone: "+443335772070",
        priceRange: "££",
        url: `https://www.ampleremovals.com/man-and-van/${village.hubSlug}/${village.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqSet.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  const whatsappMessage = `Hi, I need a man and van in ${village.name}, ${hub.name}. Can you give me a quote? (Page: https://www.ampleremovals.com/man-and-van/${village.hubSlug}/${village.slug})`;

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StickyQuoteBar quoteHref="/booking/man-and-van" whatsappMessage={whatsappMessage} />
      {/* Hero — speed-led, green accent */}
      <section className="bg-gradient-to-br from-brand-green-700 to-brand-green-900 px-6 pb-16 pt-28 text-white lg:pt-36">
        <div className="container mx-auto max-w-3xl">
          <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-brand-green-200">
            {village.postcode} · {hub.name}, {hub.county}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-green-100">{subhead}</p>
          <p className="mt-3 max-w-2xl text-sm text-brand-green-200">{village.character}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-brand-green-800 hover:bg-slate-100">
              <Link href="/booking/man-and-van">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <WhatsAppButton message={whatsappMessage} />
            <a href="tel:03335772070" className="inline-flex items-center gap-2 rounded-xl border border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
              <Phone className="h-4 w-4" /> Or call 0333 577 2070
            </a>
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
            <Link href="/booking/man-and-van">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
