import type { Metadata } from "next";
import { AlertCircle, TrendingUp, Clock, FileText, Truck, Repeat, Zap, Calendar } from "lucide-react";
import { LOGISTICS, logisticsPageMetadata } from "@/lib/logistics";
import { BusinessRequestForm } from "@/components/logistics/BusinessRequestForm";
import { PageHero, SectionHeading, ManifestRow, PrimaryButton, GhostButton } from "@/components/logistics/LogisticsKit";
import { FadeIn } from "@/components/logistics/FadeIn";

export const metadata: Metadata = logisticsPageMetadata(
  "For Businesses — Hire an HGV Driver | Ample Logistics",
  "Find temporary and short-notice HGV driver staffing solutions for your transport or logistics operation across Berkshire England.",
  "/businesses"
);

const CHALLENGES = [
  { icon: AlertCircle, label: "Unexpected driver absences" },
  { icon: TrendingUp, label: "Increased delivery demand" },
  { icon: Calendar, label: "Seasonal workload fluctuations" },
  { icon: FileText, label: "Temporary contract requirements" },
  { icon: Truck, label: "Additional vehicles or routes" },
  { icon: Clock, label: "Last-minute operational changes" },
];

const SOLUTIONS = [
  { title: "Temporary HGV Driver Staffing", body: "Cover for absence, leave, or short-term increases in demand, for as long as the assignment requires." },
  { title: "Short-Notice Driver Requirements", body: "Tell us what's happened and we'll work to identify suitable, available drivers as quickly as we reasonably can." },
  { title: "Flexible Shift Cover", body: "Day, night, or weekend shifts — we work around your operation's actual working pattern." },
  { title: "Recurring Driver Staffing Requirements", body: "For businesses that need ongoing flexible cover rather than a one-off placement." },
];

const REQUEST_STEPS = [
  { title: "Submit Your Requirements", body: "Tell us the vehicle category, location, and shift pattern you need covering." },
  { title: "We Check Availability", body: "Our team reviews the details and checks suitable driver availability." },
  { title: "We Agree Terms", body: "We discuss rates, assignment terms, and any necessary arrangements." },
  { title: "Driver Scheduled", body: "Once agreed, the driver is scheduled for the assignment." },
];

export default function BusinessesPage() {
  return (
    <>
      <PageHero
        eyebrow="For Businesses"
        title={<>Your Next HGV<br />Driver Starts Here.</>}
        subtitle="Find temporary and short-notice HGV driver staffing solutions for your transport or logistics operation across Berkshire England."
        cta={<>
          <PrimaryButton href="#request-form">Request a Driver</PrimaryButton>
          <GhostButton href="/contact">Speak to Our Team</GhostButton>
        </>}
      />

      <section className="px-6 py-20">
        <div className="container mx-auto max-w-4xl">
          <SectionHeading eyebrow="The Problem" title="Every Shift Matters" />
          <div className="mt-10 grid gap-x-10 sm:grid-cols-2">
            {CHALLENGES.map((c) => (
              <FadeIn key={c.label}>
                <div className="flex items-center gap-3 border-t py-4" style={{ borderColor: LOGISTICS.colors.line }}>
                  <c.icon className="h-5 w-5 shrink-0" style={{ color: LOGISTICS.colors.blue }} />
                  <span className="font-medium text-slate-700">{c.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">Ample Logistics works as a staffing partner to help businesses respond to these challenges.</p>
        </div>
      </section>

      <section className="px-6 py-20" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-5xl">
          <SectionHeading eyebrow="Solutions" title="How We Can Help" align="center" />
          <div className="mx-auto mt-12 max-w-3xl">
            {SOLUTIONS.map((s, i) => (
              <ManifestRow key={s.title} index={i + 1} title={s.title} body={s.body} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="container mx-auto max-w-5xl">
          <SectionHeading eyebrow="Process" title="How to Request a Driver" align="center" />
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {REQUEST_STEPS.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.08}>
                <p className="text-4xl font-black" style={{ fontFamily: "var(--font-logistics-display)", color: LOGISTICS.colors.blue }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="request-form" className="px-6 py-24" style={{ background: LOGISTICS.colors.ink }}>
        <div className="container mx-auto max-w-3xl">
          <SectionHeading eyebrow="Submit a Request" title="Driver Request Form" body="Tell us what you need and our team will review it and come back to you." dark align="center" />
          <div className="mt-10 bg-white p-6 sm:p-10">
            <BusinessRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}
