import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HUBS } from "@/lib/hubs";
import { VILLAGES } from "@/lib/villages";
import { StickyQuoteBar } from "@/components/local/StickyQuoteBar";

export interface ServiceIndexProps {
  service: "house-removals" | "man-and-van" | "house-clearance" | "rubbish-removal";
  title: string;
  heroHeadline: string;
  heroSub: string;
  whatsappMessage: string;
}

/** Shared top-level service index page (e.g. /house-removals) — links down
 *  into every hub and village page for that service, with Newbury and
 *  Thatcham (our home patch, and the two flagship /locations pages) given
 *  top billing per the SEO plan. Used by the 4 service verticals so each
 *  gets a real, crawlable parent page instead of villages being orphaned
 *  three levels deep with no index above them. */
export function ServiceIndexPage({ service, title, heroHeadline, heroSub, whatsappMessage }: ServiceIndexProps) {
  const villagesByHub = HUBS.map((hub) => ({
    hub,
    villages: VILLAGES.filter((v) => v.hubSlug === hub.slug),
  })).filter((g) => g.villages.length > 0);

  return (
    <div className="pb-20">
      <StickyQuoteBar quoteHref="/booking" whatsappMessage={whatsappMessage} />

      <section className="bg-gradient-to-br from-brand-purple-800 to-brand-purple-950 px-6 pb-16 pt-28 text-white lg:pt-36">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-brand-purple-200">{title}</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{heroHeadline}</h1>
          <p className="mt-4 text-lg text-brand-purple-100">{heroSub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-brand-green-600 hover:bg-brand-green-500">
              <Link href="/booking">
                Get a free quote <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Home patch — Newbury & Thatcham flagship pages get top billing */}
      <section className="px-6 py-14">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">Our Home Patch</h2>
          <p className="mt-2 text-slate-600">Based in Thatcham, covering Newbury and Thatcham in depth.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/locations/newbury"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-purple-300 hover:shadow-md"
            >
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-brand-purple-700" /> Newbury
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/locations/thatcham"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-purple-300 hover:shadow-md"
            >
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-brand-purple-700" /> Thatcham
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Every hub + village, grouped */}
      <section className="bg-slate-50 px-6 py-14">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-bold text-slate-900">Areas We Cover</h2>
          <div className="mt-8 space-y-10">
            {villagesByHub.map(({ hub, villages }) => (
              <div key={hub.slug}>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {hub.name}, {hub.county}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {villages.map((v) => (
                    <Link
                      key={v.slug}
                      href={`/${service}/${v.hubSlug}/${v.slug}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-purple-300 hover:text-brand-purple-700"
                    >
                      {v.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
