import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Zap, Users2, ShieldCheck, MessageSquareText, Repeat, Building2, Warehouse, Package, Store, Phone } from "lucide-react";
import { LOGISTICS, BERKSHIRE_TOWNS, logisticsPageMetadata } from "@/lib/logistics";
import { FadeIn } from "@/components/logistics/FadeIn";
import { LogisticsHero } from "@/components/logistics/LogisticsHero";
import { SectionHeading, ManifestRow, PrimaryButton, GhostButton, Tag, HazardCorner, RoadSign, RouteSteps } from "@/components/logistics/LogisticsKit";

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

const STEPS = [
  { title: "Tell Us What You Need", body: "Share your location, vehicle category, shift times, assignment duration, and staffing requirements." },
  { title: "We Identify Suitable Drivers", body: "Our team reviews the requirements and works to match your business with appropriately qualified and available drivers." },
  { title: "Get Your Staffing Covered", body: "Once the assignment and terms are agreed, the selected driver can be scheduled to support your operation." },
];

export default function LogisticsHomePage() {
  return (
    <>
      <LogisticsHero />

      {/* Service overview — manifest rows, not a card grid */}
      <section className="relative overflow-hidden px-6 py-24">
        <HazardCorner className="-left-20 -top-20 right-auto" />
        <div className="container relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="What We Do" title="Staffing, Made Straightforward" body="When driver shortages disrupt your operation, Ample Logistics helps you find suitable drivers for your staffing requirements." />
          <div>
            {SERVICES.map((s, i) => (
              <ManifestRow key={s.title} index={i + 1} title={s.title} body={s.body} icon={<s.icon className="h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works — three stops along one route */}
      <section className="px-6 py-24" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-5xl">
          <SectionHeading eyebrow="Process" title="Three Stops To Covered Shifts" align="center" />
          <RouteSteps steps={STEPS} columns={3} />
        </div>
      </section>

      {/* Who we support — bays on a loading dock */}
      <section className="px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <SectionHeading eyebrow="Who We Support" title="Built For Operators Who Can't Afford Downtime" body="Actual service availability depends on the assignment and the drivers available." />
          <div className="mt-12 grid gap-px border sm:grid-cols-2 lg:grid-cols-3" style={{ borderColor: LOGISTICS.colors.line, background: LOGISTICS.colors.line }}>
            {INDUSTRIES.map((i, idx) => (
              <FadeIn key={i.label} delay={idx * 0.04}>
                <div className="group flex h-full items-center gap-4 bg-white p-6 transition-colors hover:bg-[#121214] hover:text-white">
                  <span className="text-xs font-semibold tabular-nums text-slate-400 group-hover:text-white/50" style={{ fontFamily: "var(--font-logistics-mono)" }}>
                    BAY {String(idx + 1).padStart(2, "0")}
                  </span>
                  <i.icon className="h-6 w-6 shrink-0" style={{ color: LOGISTICS.colors.blue }} />
                  <span className="font-semibold">{i.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us — dark ink panel */}
      <section className="relative overflow-hidden px-6 py-24 text-white" style={{ background: LOGISTICS.colors.ink }}>
        <HazardCorner />
        <div className="container relative mx-auto max-w-5xl">
          <SectionHeading eyebrow="Why Ample Logistics" title="Run Like An Operations Desk, Not A Call Centre" dark align="center" />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w, i) => (
              <FadeIn key={w.title} delay={i * 0.07} className="border-t pt-5" style={{ borderColor: LOGISTICS.colors.lineOnDark }}>
                <w.icon className="h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />
                <h3 className="mt-3 text-base font-bold" style={{ fontFamily: "var(--font-logistics-display)" }}>{w.title}</h3>
                <p className="mt-1.5 text-sm text-white/60">{w.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Service area */}
      <section className="px-6 py-24">
        <div className="container mx-auto max-w-4xl text-center">
          <SectionHeading eyebrow="Service Area" title="Covering Berkshire, England" body="Ample Logistics works with businesses seeking HGV driver staffing support across Berkshire." align="center" />
          <FadeIn delay={0.1}>
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
              {BERKSHIRE_TOWNS.map((t) => (<Tag key={t}>{t}</Tag>))}
            </div>
          </FadeIn>
          <p className="mt-6 text-xs text-slate-400" style={{ fontFamily: "var(--font-logistics-mono)" }}>These are proposed coverage locations, subject to confirmed availability.</p>
          <div className="mt-8 flex justify-center">
            <PrimaryButton href="/businesses">Discuss Your Driver Requirements</PrimaryButton>
          </div>
        </div>
      </section>

      {/* Final CTA — on a gantry sign */}
      <section className="relative overflow-hidden px-6 pb-28 pt-24 text-white" style={{ background: LOGISTICS.colors.ink }}>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1.5"
          style={{ backgroundImage: `repeating-linear-gradient(135deg, ${LOGISTICS.colors.blue} 0 14px, ${LOGISTICS.colors.navy} 14px 28px)` }}
        />
        <FadeIn className="container relative mx-auto max-w-4xl">
          <RoadSign>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80" style={{ fontFamily: "var(--font-logistics-mono)" }}>Get Started — Berkshire</p>
            <h2 className="mt-4 text-4xl font-extrabold uppercase leading-[0.98] tracking-tight sm:text-6xl" style={{ fontFamily: "var(--font-logistics-display)" }}>
              Need A Driver For Your Next Shift?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">Tell us about your staffing requirements and let our team explore the right solution for your business.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/businesses" className="inline-flex items-center justify-center gap-2 bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#0e5a2b] transition-colors hover:bg-[#f5c518] hover:text-black">Request a Driver</Link>
              <GhostButton href={LOGISTICS.phoneHref}><Phone className="h-4 w-4" /> {LOGISTICS.phone}</GhostButton>
            </div>
          </RoadSign>
        </FadeIn>
      </section>
    </>
  );
}
