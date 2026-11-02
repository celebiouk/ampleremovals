import type { Metadata } from "next";
import { CalendarClock, Layers, MessageCircle, HeartHandshake, ChevronDown } from "lucide-react";
import { LOGISTICS, logisticsPageMetadata } from "@/lib/logistics";
import { DriverApplicationForm } from "@/components/logistics/DriverApplicationForm";
import { PageHero, SectionHeading, ManifestRow, PrimaryButton, GhostButton } from "@/components/logistics/LogisticsKit";
import { FadeIn } from "@/components/logistics/FadeIn";

export const metadata: Metadata = logisticsPageMetadata(
  "For Drivers — Find HGV Driving Work | Ample Logistics",
  "Register your interest with Ample Logistics for temporary HGV driving assignments and potential ongoing opportunities across Berkshire England.",
  "/drivers"
);

const BENEFITS = [
  { icon: CalendarClock, title: "Flexible Opportunities", body: "Register your availability for temporary assignments that may suit your schedule." },
  { icon: Layers, title: "Variety of Assignments", body: "Express interest in different types of HGV driving work, depending on your licence and experience." },
  { icon: MessageCircle, title: "Clear Communication", body: "Receive information about potential assignments, requirements, and working arrangements." },
  { icon: HeartHandshake, title: "Professional Support", body: "Have a point of contact for questions about assignments and registration." },
];

const REQUIREMENTS = [
  "A valid UK-recognised HGV driving licence for the required vehicle category",
  "A valid Driver Certificate of Professional Competence (Driver CPC), where required",
  "A valid digital tachograph card, where required",
  "Relevant driving experience",
  "An acceptable driving record for the assignment",
  "The legal right to work in the UK",
  "Availability for the advertised shift or assignment",
];

const FAQS = [
  { q: "What types of HGV driving work may be available?", a: "Assignments vary and may include haulage, distribution, delivery, and fleet work, depending on current business requirements and the availability of suitable drivers." },
  { q: "Which licence categories do you recruit for?", a: "We register interest from drivers holding Category C+E (Class 1), Category C (Class 2), Category C1, and other relevant commercial driving licences." },
  { q: "Can I register if I am looking for temporary work?", a: "Yes — temporary and flexible assignments are a core part of what Ample Logistics works to arrange." },
  { q: "What documents might I need?", a: "Depending on the assignment, this may include your driving licence, Driver CPC card, digital tachograph card, and proof of your right to work in the UK. We'll confirm exactly what's needed during registration." },
  { q: "How will I hear about suitable assignments?", a: "Our team will contact you using the details you provide if a suitable opportunity matching your licence, experience, and availability comes up." },
  { q: "Can I update my availability?", a: "Yes — contact us any time your availability or preferences change so our records stay accurate." },
];

export default function DriversPage() {
  return (
    <>
      <PageHero
        eyebrow="For Drivers"
        title={<>Find Your Next<br />Driving Assignment.</>}
        subtitle="Register your interest with Ample Logistics for temporary HGV driving assignments and potential ongoing opportunities across our service area."
        cta={<>
          <PrimaryButton href="#register-form">Register as a Driver</PrimaryButton>
          <GhostButton href="/about">Explore Opportunities</GhostButton>
        </>}
      />

      <section className="px-6 py-20">
        <div className="container mx-auto max-w-5xl">
          <SectionHeading eyebrow="Why Register" title="Why Drive With Ample" align="center" />
          <div className="mx-auto mt-12 grid max-w-3xl gap-x-10 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <ManifestRow key={b.title} index={i + 1} title={b.title} body={b.body} icon={<b.icon className="h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />} />
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-slate-400" style={{ fontFamily: "var(--font-logistics-mono)" }}>
            Registering does not guarantee shifts, minimum earnings, or immediate employment.
          </p>
        </div>
      </section>

      <section className="px-6 py-20" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-3xl">
          <SectionHeading eyebrow="Eligibility" title="Who Can Register?" body="Ample Logistics welcomes applications from drivers who meet the requirements of relevant assignments. Depending on the role, applicants may need:" />
          <ul className="mt-8 space-y-0">
            {REQUIREMENTS.map((r, i) => (
              <li key={r} className="flex gap-4 border-t py-3.5 text-sm text-slate-700 first:border-t-0" style={{ borderColor: LOGISTICS.colors.line }}>
                <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-logistics-mono)", color: LOGISTICS.colors.blue }}>{String(i + 1).padStart(2, "0")}</span>
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-slate-500">Requirements vary by role and will be confirmed during registration.</p>
        </div>
      </section>

      <section id="register-form" className="px-6 py-24" style={{ background: LOGISTICS.colors.ink }}>
        <div className="container mx-auto max-w-3xl">
          <SectionHeading eyebrow="Register" title="Driver Registration" dark align="center" />
          <div className="mt-10 bg-white p-6 sm:p-10">
            <DriverApplicationForm />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="container mx-auto max-w-3xl">
          <SectionHeading eyebrow="Questions" title="Driver FAQ" />
          <div className="mt-8">
            {FAQS.map((f, i) => (
              <FadeIn key={f.q} delay={i * 0.03}>
                <details className="group border-t py-4" style={{ borderColor: LOGISTICS.colors.line }}>
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold" style={{ color: LOGISTICS.colors.ink }}>
                    {f.q}
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: LOGISTICS.colors.blue }} />
                  </summary>
                  <p className="mt-2 text-sm text-slate-600">{f.a}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
