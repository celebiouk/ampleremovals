import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VILLAGES, VILLAGE_MAP } from "@/lib/villages";
import { HUB_MAP } from "@/lib/hubs";
import { pickVariant } from "@/lib/local-variants";
import { ShieldCheck, Package, Home, ArrowRight, Phone } from "lucide-react";
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
    title: `House Removals ${village.name} — Instant Standard & Premium Price`,
    description: `See your exact ${village.name} house removal price in seconds — Standard or Premium, deposit now, balance later. Our ${hub.name}-area team, fully insured, start to finish.`,
    alternates: { canonical: `https://www.ampleremovals.com/house-removals/${village.hubSlug}/${village.slug}` },
  };
}

const HEADLINES = (v: string) => [
  `Your Whole Home in ${v}, Moved Properly — Standard or Premium, Priced Instantly`,
  `${v} House Removals, Done Right — See Your Price Before You Call Anyone Else`,
  `Stop Comparing Vague Quotes. Get Your Exact ${v} Moving Price in Seconds.`,
];

const SUBHEADS = (v: string) => [
  `Tell us your home size below and watch your Standard and Premium ${v} price appear instantly — then pay a small deposit to lock in your date. No site visit, no "we'll email you a quote."`,
  `Most removal firms make you wait days for a number that still isn't final. Pick your home size, see both price options for your ${v} move right now, and secure the date before someone else does.`,
  `Full pack-and-move, or just the heavy lifting — either way, enter your home size and see your exact ${v} price on screen. Deposit now, balance later, nothing hidden.`,
];

const TIMELINE_SETS = (v: string) => [
  [
    { step: "1", title: "A proper survey, not a guess", body: "We find out what you're actually moving — room count, stairs, access — before we quote, so the price on moving day matches the price we gave you." },
    { step: "2", title: "Your things, properly protected", body: "Furniture blankets, fragile-item boxes, careful loading in an order that makes sense for your new place — not just stacked in." },
    { step: "3", title: "In, unpacked, done", body: `We carry everything into the right rooms in your ${v} home, not just the hallway, and take the packaging away with us if you want it gone.` },
  ],
  [
    { step: "1", title: "We ask the awkward questions upfront", body: `Lofts, sheds, piano, parking restrictions near your ${v} address — we'd rather ask now than discover it on the day.` },
    { step: "2", title: "Loaded in the right order", body: "Heavy and fragile items get handled properly, and the van's packed so nothing shifts on the drive." },
    { step: "3", title: "Set down where you want it", body: "Boxes and furniture go to the room you point at, not dumped by the front door." },
  ],
  [
    { step: "1", title: "Quote first, surprises never", body: "A clear price before moving day, based on what you're actually moving — not an estimate that grows once we arrive." },
    { step: "2", title: "Packed to survive the journey", body: "Proper materials for fragile items, blankets for furniture, labelled boxes if you want them room-sorted." },
    { step: "3", title: "Moved in, not just delivered", body: `Furniture placed, boxes stacked where you want them — your ${v} move finished properly, not half-done.` },
  ],
];

const PROOF_INTROS = (hubName: string) => [
  [`Fully insured`, `Goods-in-transit cover on every move.`, `Packing materials included`, `Boxes, tape and wrap, or we pack it all for you.`, `Stairs and access, no surprise fee`, `We ask about access upfront so the quote's the final price.`],
  [`Properly insured, every job`, `Cover that protects what actually matters to you.`, `Materials sorted, no extra trip to the shop`, `We bring what's needed, or do the packing ourselves.`, `No last-minute access charges`, `Flagged and priced before the day, not added after.`],
];

const FAQS = (village: { name: string }, hub: { name: string }) => [
  [
    { q: `How far in advance should I book?`, a: `For a full house move in ${village.name}, 2–3 weeks' notice gets you the widest choice of dates — but call us if it's sooner, we'll always try.` },
    { q: `Do you move to/from flats with stairs?`, a: `Yes — just tell us the floor and whether there's a lift when you book, so the crew and timing are right on the day.` },
    { q: `Can you store my things if my dates don't line up?`, a: `Yes, short-term storage is available — useful for ${village.name} chain moves where completion dates shift.` },
  ],
  [
    { q: `What if my moving date changes last minute?`, a: `Let us know as early as you can — we'll do our best to shift your ${village.name} slot, though weekends fill up fastest.` },
    { q: `Do you take apart beds and wardrobes?`, a: `Yes, for furniture that won't fit through doorways or down stairs — tell us in advance so we bring the right tools.` },
    { q: `Is there anything you won't move?`, a: `Hazardous materials, mainly — if you're unsure about something specific, just ask when you book.` },
  ],
  [
    { q: `Can you handle a chain move with a tight turnaround?`, a: `Yes — same-day collection and delivery is common for ${village.name} chain completions, we just need the timings in advance.` },
    { q: `Do I need to empty drawers and wardrobes first?`, a: `Not fully — lighter items can usually stay in drawers, we'll let you know what to clear when we survey.` },
    { q: `What's your coverage area around ${hub.name}?`, a: `Anywhere within reasonable reach of ${hub.name}, including every village we've listed nearby below.` },
  ],
];

const CTA_LINES = (v: string) => [
  { heading: `Still comparing quotes for your ${v} move?`, sub: `See your exact price now — it's faster than waiting for the next callback.` },
  { heading: `Your ${v} move, priced in seconds`, sub: `Pick your home size, see Standard and Premium, lock in your date.` },
  { heading: `Don't leave your ${v} move to the last minute`, sub: `Get your price now, pay a small deposit, the date's yours.` },
];

export default async function HouseRemovalsVillagePage({ params }: { params: Promise<{ hub: string; village: string }> }) {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) notFound();
  const hub = HUB_MAP[village.hubSlug];
  const siblings = village.nearbyVillages.map((s) => VILLAGE_MAP[s]).filter(Boolean);

  const headline = pickVariant(village.slug, "house-removals-headline", HEADLINES(village.name));
  const subhead = pickVariant(village.slug, "house-removals-subhead", SUBHEADS(village.name));
  const timeline = pickVariant(village.slug, "house-removals-timeline", TIMELINE_SETS(village.name));
  const proof = pickVariant(village.slug, "house-removals-proof", PROOF_INTROS(hub.name));
  const faqSet = pickVariant(village.slug, "house-removals-faq", FAQS(village, hub));
  const cta = pickVariant(village.slug, "house-removals-cta", CTA_LINES(village.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: `Ample Removals — House Removals, ${village.name}`,
        areaServed: { "@type": "Place", name: `${village.name}, ${hub.county}`, address: { "@type": "PostalAddress", addressLocality: village.name, postalCode: village.postcode, addressRegion: hub.county, addressCountry: "GB" } },
        geo: { "@type": "GeoCoordinates", latitude: village.lat, longitude: village.lng },
        telephone: "+443335772070",
        priceRange: "££",
        url: `https://www.ampleremovals.com/house-removals/${village.hubSlug}/${village.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqSet.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  const whatsappMessage = `Hi, I'm moving house in ${village.name}, ${hub.name}. Can you give me a quote? (Page: https://www.ampleremovals.com/house-removals/${village.hubSlug}/${village.slug})`;

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StickyQuoteBar quoteHref="/booking" whatsappMessage={whatsappMessage} />
      {/* Hero — trust-led, purple */}
      <section className="bg-gradient-to-br from-brand-purple-800 to-brand-purple-950 px-6 pb-20 pt-28 text-white lg:pt-36">
        <div className="container mx-auto max-w-3xl">
          <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-brand-purple-200">
            House removals · {village.name}, {hub.county}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-purple-100">{subhead}</p>
          <p className="mt-3 max-w-2xl text-sm text-brand-purple-200">{village.character}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-green-600 hover:bg-brand-green-500">
              <Link href="/booking">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <WhatsAppButton message={whatsappMessage} />
            <a href="tel:03335772070" className="inline-flex items-center gap-2 rounded-xl border border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
              <Phone className="h-4 w-4" /> Or call 0333 577 2070
            </a>
          </div>
        </div>
      </section>

      {/* Timeline module — unique to this service */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center font-display text-2xl font-bold text-slate-900">How a {village.name} move actually goes</h2>
          <div className="mt-10 space-y-8">
            {timeline.map((t) => (
              <div key={t.step} className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple-800 font-display text-lg font-bold text-white">{t.step}</div>
                <div>
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  <p className="mt-1 text-slate-600">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {village.accessNote && (
        <section className="bg-slate-50 px-6 py-10">
          <div className="container mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-900">If you're in {village.name}:</p>
            <p className="mt-2 text-slate-600">{village.accessNote}</p>
          </div>
        </section>
      )}

      {/* Proof module */}
      <section className="bg-brand-purple-50 px-6 py-16">
        <div className="container mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {[ShieldCheck, Package, Home].map((Icon, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <Icon className="mx-auto h-8 w-8 text-brand-purple-700" />
              <p className="mt-3 font-semibold text-slate-900">{proof[i * 2]}</p>
              <p className="mt-1 text-sm text-slate-600">{proof[i * 2 + 1]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">Moving house in {village.name}</h2>
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
            <p className="text-sm font-semibold text-slate-500">We also move house in:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/house-removals/${s.hubSlug}/${s.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-purple-700 hover:bg-brand-purple-50">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-brand-green-700 px-6 py-14 text-center text-white">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold">{cta.heading}</h2>
          <p className="mt-2 text-brand-green-100">{cta.sub}</p>
          <Button asChild size="lg" className="mt-6 bg-white text-brand-green-800 hover:bg-brand-green-50">
            <Link href="/booking">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
