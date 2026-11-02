import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Zap, Users2, ShieldCheck, MessageSquareText, Repeat, ArrowRight, Building2, Warehouse, Package, Store, Phone } from "lucide-react";
import { LOGISTICS, BERKSHIRE_TOWNS, logisticsPageMetadata } from "@/lib/logistics";
import { FadeIn } from "@/components/logistics/FadeIn";
import { LogisticsHero } from "@/components/logistics/LogisticsHero";

export const metadata: Metadata = logisticsPageMetadata(
  "Ample Logistics | HGV Driver Agency Berkshire",
  "Ample Logistics connects businesses across Berkshire with qualified HGV drivers for temporary cover, urgent staffing requirements, and flexible logistics support.",
  "/"
);

const SERVICES = [
  { icon: Repeat, title: "Temporary HGV Driver Cover", body: "Access drivers for temporary assignments, staff absences, seasonal demand, and additional workload." },
  { icon: Zap, title: "Urgent Driver Requirements", body: "Tell us about your immediate staffing needs, and our team will work to identify suitable available drivers as quickly as possible." },
  { icon: Users2, title: "Flexible Workforce Support", body: "Find driver staffing support for short-term assignments, recurring requirements, and changing operational demands." },
];

const INDUSTRIES = [
  { icon: Truck, label: "Haulage Companies" },
  { icon: Building2, label: "Transport Operators" },
  { icon: Warehouse, label: "Distribution Centres" },
  { icon: Package, label: "Warehousing and Logistics" },
  { icon: Store, label: "Retail Distribution" },
  { icon: Truck, label: "Delivery and Fleet Operators" },
];

const WHY = [
  { icon: MessageSquareText, title: "Responsive Service", body: "We aim to respond quickly and communicate clearly on every enquiry." },
  { icon: ShieldCheck, title: "Qualified Driver Recruitment", body: "Drivers are assessed against the licence category and requirements of each assignment." },
  { icon: Repeat, title: "Flexible Staffing Solutions", body: "From a single shift to recurring cover, we work around your operation." },
  { icon: Zap, title: "Clear Communication", body: "You'll always know where a request stands — no chasing for updates." },
];

export default function LogisticsHomePage() {
  return (
    <>
      <LogisticsHero />

      {/* Service overview */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-5xl text-center">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>HGV Driver Staffing Made Simple</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">When driver shortages disrupt your operation, Ample Logistics helps you find suitable drivers for your staffing requirements.</p>
          </FadeIn>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {SERVICES.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.08}>
                <div className="group h-full rounded-2xl border border-slate-200 p-6 text-left transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-xl">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}1a, ${LOGISTICS.colors.blue}1a)` }}>
                    <s.icon className="h-6 w-6" style={{ color: LOGISTICS.colors.blue }} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold" style={{ color: LOGISTICS.colors.navy }}>{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.body}</p>
                  <Link href="/businesses" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: LOGISTICS.colors.blue }}>Learn more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-5xl text-center">
          <FadeIn><h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Getting the Right Driver Should Be Simple</h2></FadeIn>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { n: 1, title: "Tell Us What You Need", body: "Share your location, vehicle category, shift times, assignment duration, and staffing requirements." },
              { n: 2, title: "We Identify Suitable Drivers", body: "Our team reviews the requirements and works to match your business with appropriately qualified and available drivers." },
              { n: 3, title: "Get Your Staffing Covered", body: "Once the assignment and terms are agreed, the selected driver can be scheduled to support your operation." },
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.1} className="text-left">
                <span className="flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.blue})` }}>{s.n}</span>
                <h3 className="mt-4 font-display text-lg font-bold" style={{ color: LOGISTICS.colors.navy }}>{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Who we support */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-5xl text-center">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Who We Support</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">Actual service availability depends on the assignment and the drivers available.</p>
          </FadeIn>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {INDUSTRIES.map((i, idx) => (
              <FadeIn key={i.label} delay={idx * 0.05}>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-slate-300">
                  <i.icon className="h-5 w-5 shrink-0" style={{ color: LOGISTICS.colors.blue }} />
                  <span className="font-semibold text-slate-800">{i.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="px-6 py-20 text-white" style={{ background: `linear-gradient(160deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.charcoal})` }}>
        <div className="container mx-auto max-w-5xl text-center">
          <FadeIn><h2 className="font-display text-3xl font-bold">Why Choose Ample Logistics?</h2></FadeIn>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {WHY.map((w, i) => (
              <FadeIn key={w.title} delay={i * 0.08} className="text-left">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <w.icon className="h-5 w-5" style={{ color: LOGISTICS.colors.amber }} />
                </span>
                <h3 className="mt-3 font-display text-base font-bold">{w.title}</h3>
                <p className="mt-1.5 text-sm text-slate-300">{w.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Service area */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Supporting Logistics Across Berkshire England</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">Ample Logistics works with businesses seeking HGV driver staffing support across Berkshire England.</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
              {BERKSHIRE_TOWNS.map((t) => (
                <span key={t} className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors hover:text-white" style={{ borderColor: `${LOGISTICS.colors.blue}55`, color: LOGISTICS.colors.navy }}>{t}</span>
              ))}
            </div>
          </FadeIn>
          <p className="mt-6 text-xs text-slate-400">These are proposed coverage locations, subject to confirmed availability.</p>
          <Link href="/businesses" className="mt-8 inline-flex items-center gap-1.5 rounded-xl px-7 py-3.5 font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.blue})` }}>Discuss Your Driver Requirements <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-6 py-20 text-center text-white" style={{ background: `linear-gradient(160deg, ${LOGISTICS.colors.charcoal}, ${LOGISTICS.colors.navy})` }}>
        <FadeIn className="container relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold">Need an HGV Driver for Your Next Shift?</h2>
          <p className="mt-3 text-slate-300">Tell us about your staffing requirements and let our team explore the right solution for your business.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/businesses" className="inline-flex items-center gap-1.5 rounded-xl px-7 py-3.5 font-bold text-white shadow-lg" style={{ background: LOGISTICS.colors.blue }}>Request a Driver</Link>
            <a href={LOGISTICS.phoneHref} className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 px-7 py-3.5 font-semibold text-white hover:bg-white/10"><Phone className="h-4 w-4" /> {LOGISTICS.phone}</a>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
