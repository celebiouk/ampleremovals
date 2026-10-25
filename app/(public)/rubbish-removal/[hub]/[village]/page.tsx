import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VILLAGES, VILLAGE_MAP } from "@/lib/villages";
import { HUB_MAP } from "@/lib/hubs";
import { pickVariant } from "@/lib/local-variants";
import { Trash2, Zap, Ban, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  return VILLAGES.map((v) => ({ hub: v.hubSlug, village: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ hub: string; village: string }> }): Promise<Metadata> {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) return { title: "Not found" };
  return {
    title: `Rubbish Removal ${village.name} — Same-Day, Priced by the Load`,
    description: `Get rid of bulky rubbish in ${village.name} (${village.postcode}) fast. No skip hire, no permit hassle — we come to you, you point, it's gone. Free quote.`,
    alternates: { canonical: `https://www.ampleremovals.com/rubbish-removal/${village.hubSlug}/${village.slug}` },
  };
}

const HERO_SUBS = (v: string) => [
  `No skip permit, no council wait, no lugging it to the tip yourself. We turn up, you point at what's going, it's in the van.`,
  `Skip hire means a permit, a wait, and a skip sitting outside for days. We're in and out of ${v} the same day, nothing left behind.`,
  `Quicker than booking a skip, cheaper than a tip run with a hired van — we do the lifting, you just point.`,
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
const LOAD_PRICING_SETS = [
  [
    { load: "Quarter load", fits: "A few bags, an old chair, small bits" },
    { load: "Half load", fits: "A mattress, a few items of furniture" },
    { load: "Full load", fits: "A room's worth, or a small garden clear-out" },
  ],
  [
    { load: "Small load", fits: "Bin bags, a small table, odds and ends" },
    { load: "Medium load", fits: "A sofa plus a few smaller items" },
    { load: "Large load", fits: "A full room, or most of a garden clear-out" },
  ],
];

const FAQS = (village: { name: string; postcode: string }, hub: { depotDistanceMiles: number }) => [
  [
    { q: `Is this cheaper than a skip?`, a: `For most ${village.name} jobs, yes — no permit fee, no waiting for collection, and you only pay for the load size you actually fill.` },
    { q: `Do I need to sort it before you arrive?`, a: `No — just point at what's going. We'll sort out what can be recycled.` },
    { q: `Can you come the same day?`, a: `Often, yes — we're ${hub.depotDistanceMiles} miles from ${village.name}. Call and we'll tell you straight away if today's possible.` },
  ],
  [
    { q: `How is the price worked out?`, a: `By how much of the van your rubbish fills — quarter, half, or full load. No hourly rate, no weight guessing.` },
    { q: `What if I'm not sure how much I've got?`, a: `Send a photo or describe it on the phone — we'll give you a realistic estimate before we even set off to ${village.name}.` },
    { q: `Do you take stuff from the garden as well as the house?`, a: `Yes — garden waste, old fencing, shed clear-outs, all in the same load if it fits.` },
  ],
  [
    { q: `Will you take it from inside the house, or just the kerb?`, a: `From wherever it's sitting — loft, garage, back garden. You don't need to drag it outside first.` },
    { q: `Is there a call-out charge if I change my mind?`, a: `No — we only charge for rubbish actually collected, there's no fee just for turning up.` },
    { q: `What's your coverage area around ${village.postcode}?`, a: `We cover ${village.name} and the villages listed near it below — just ask if you're unsure.` },
  ],
];

const CTA_HEADINGS = (v: string) => [
  `Get ${v}'s rubbish gone`,
  `Book your ${v} rubbish collection`,
  `Clear it out of ${v} today`,
];

export default async function RubbishRemovalVillagePage({ params }: { params: Promise<{ hub: string; village: string }> }) {
  const { village: slug } = await params;
  const village = VILLAGE_MAP[slug];
  if (!village) notFound();
  const hub = HUB_MAP[village.hubSlug];
  const siblings = village.nearbyVillages.map((s) => VILLAGE_MAP[s]).filter(Boolean);

  const heroSub = pickVariant(village.slug, "rubbish-hero", HERO_SUBS(village.name));
  const faqSet = pickVariant(village.slug, "rubbish-faq", FAQS(village, hub));
  const ctaHeading = pickVariant(village.slug, "rubbish-cta", CTA_HEADINGS(village.name));
  const weTake = pickVariant(village.slug, "rubbish-we-take", WE_TAKE_SETS);
  const cantTake = pickVariant(village.slug, "rubbish-cant-take", CANT_TAKE_SETS);
  const LOAD_PRICING = pickVariant(village.slug, "rubbish-pricing", LOAD_PRICING_SETS);

  return (
    <div>
      {/* Hero — bold, punchy, price-led */}
      <section className="bg-brand-green-600 px-6 py-16 text-white">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Rubbish gone from {village.name}, today or tomorrow
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-green-50">{heroSub}</p>
          <p className="mt-2 text-sm font-semibold text-brand-green-100">{village.postcode} · {village.name}, {hub.county}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
              <Link href="/booking/house-clearance">Get an instant price <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <a href="tel:03335772070"><Phone className="h-4 w-4" /> 0333 577 2070</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Load pricing table — unique to this service */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">Priced by the load — no surprises</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            {LOAD_PRICING.map((row, i) => (
              <div key={row.load} className={`flex items-center justify-between gap-4 px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-brand-green-600" />
                  <span className="font-semibold text-slate-900">{row.load}</span>
                </div>
                <span className="text-sm text-slate-600">{row.fits}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">Exact price confirmed before we book anything in — no hidden tip fees added after.</p>
        </div>
      </section>

      {/* What we take / can't take */}
      <section className="bg-slate-50 px-6 py-16">
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
        <section className="px-6 py-10">
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
          <Button asChild size="lg" className="mt-6 bg-brand-green-600 hover:bg-brand-green-500">
            <Link href="/booking/house-clearance">Get an instant price <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
