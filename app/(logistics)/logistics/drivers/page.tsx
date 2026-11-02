import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Layers, MessageCircle, HeartHandshake, ChevronDown } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";
import { DriverApplicationForm } from "@/components/logistics/DriverApplicationForm";

export const metadata: Metadata = {
  title: "For Drivers — Find HGV Driving Work | Ample Logistics",
  description: "Register your interest with Ample Logistics for temporary HGV driving assignments and potential ongoing opportunities across Berkshire England.",
  alternates: { canonical: "https://amplelogistics.co.uk/drivers" },
};

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
      <section className="px-6 py-20 text-white" style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.charcoal})` }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Looking for Your Next HGV Driving Opportunity?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">Register your interest with Ample Logistics for temporary HGV driving assignments and potential ongoing opportunities across our service area.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="#register-form" className="inline-flex items-center gap-1.5 rounded-xl px-7 py-3.5 font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Register as a Driver <ArrowRight className="h-4 w-4" /></a>
            <Link href="/about" className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 px-7 py-3.5 font-semibold text-white hover:bg-white/10">Explore Opportunities</Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-center font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Why Register With Ample Logistics?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-slate-200 p-6">
                <b.icon className="h-6 w-6" style={{ color: LOGISTICS.colors.blue }} />
                <h3 className="mt-3 font-display text-base font-bold" style={{ color: LOGISTICS.colors.navy }}>{b.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{b.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">Registering does not guarantee shifts, minimum earnings, or immediate employment.</p>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Who Can Register?</h2>
          <p className="mt-3 text-slate-600">Ample Logistics welcomes applications from drivers who meet the requirements of relevant assignments. Depending on the role, applicants may need:</p>
          <ul className="mt-5 space-y-2.5">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex gap-2.5 text-sm text-slate-700"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: LOGISTICS.colors.blue }} />{r}</li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-slate-500">Requirements vary by role and will be confirmed during registration.</p>
        </div>
      </section>

      <section id="register-form" className="px-6 py-20">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center" style={{ color: LOGISTICS.colors.navy }}>Driver Registration</h2>
          <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-10">
            <DriverApplicationForm />
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Driver FAQ</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl bg-white p-4">
                <summary className="flex cursor-pointer items-center justify-between font-semibold" style={{ color: LOGISTICS.colors.navy }}>
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
