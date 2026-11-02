import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, MessageSquareText, Handshake, FileCheck2, UserCheck, IdCard, Gauge } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";

export const metadata: Metadata = {
  title: "About Us | Ample Logistics",
  description: "Ample Logistics helps bridge the gap between businesses that need HGV drivers and drivers seeking suitable work opportunities across Berkshire England.",
  alternates: { canonical: "https://amplelogistics.co.uk/about" },
};

const VALUES = [
  { icon: ShieldCheck, title: "Reliability", body: "Taking staffing requirements seriously and communicating clearly." },
  { icon: Clock, title: "Safety", body: "Respecting applicable driving, vehicle, and workplace safety requirements." },
  { icon: MessageSquareText, title: "Responsiveness", body: "Working efficiently to understand changing staffing needs." },
  { icon: Handshake, title: "Professionalism", body: "Treating drivers and business clients with respect." },
];

const CHECKS = [
  { icon: IdCard, label: "Licence category verification" },
  { icon: FileCheck2, label: "Driver qualification checks" },
  { icon: FileCheck2, label: "Driver CPC verification where applicable" },
  { icon: Gauge, label: "Digital tachograph card verification where applicable" },
  { icon: UserCheck, label: "Right-to-work checks" },
  { icon: FileCheck2, label: "Reference or employment history checks where appropriate" },
  { icon: ShieldCheck, label: "Assignment-specific eligibility requirements" },
];

export default function AboutPage() {
  return (
    <>
      <section className="px-6 py-20 text-white" style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.charcoal})` }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Connecting Reliable Drivers With Businesses That Keep Britain Moving.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">Ample Logistics helps bridge the gap between businesses that need HGV drivers and drivers seeking suitable work opportunities across Berkshire England.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto max-w-2xl space-y-4 text-slate-700">
          <h2 className="font-display text-2xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Our Story</h2>
          <p>At Ample Logistics, we understand how important reliable driver staffing is to transport and logistics operations. When a shift needs covering or demand increases unexpectedly, businesses need a straightforward way to communicate their requirements and find suitable drivers.</p>
          <p>Our focus is to connect businesses with appropriately qualified drivers through clear communication, careful matching, and practical staffing support.</p>
          <p>We also help drivers express their interest in temporary assignments and potential ongoing opportunities that match their qualifications, experience, and availability.</p>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Our Mission</h2>
          <p className="mt-3 text-slate-600">To make HGV driver staffing more straightforward by connecting businesses with suitable drivers and helping drivers access relevant work opportunities.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-center font-display text-2xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Our Values</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 p-6">
                <v.icon className="h-6 w-6" style={{ color: LOGISTICS.colors.blue }} />
                <h3 className="mt-3 font-display text-base font-bold" style={{ color: LOGISTICS.colors.navy }}>{v.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Our Approach to Driver Compliance</h2>
          <p className="mt-3 text-slate-600">Driver suitability depends on the requirements of the assignment. Depending on the role, this may include:</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 rounded-xl bg-white p-3 text-sm text-slate-700">
                <c.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LOGISTICS.colors.blue }} />
                {c.label}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-slate-400">All checks are carried out in accordance with applicable UK legislation and data protection requirements.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Our Service Area</h2>
          <p className="mt-3 text-slate-600">Ample Logistics aims to support businesses across Berkshire England, subject to confirmed coverage and driver availability.</p>
        </div>
      </section>

      <section className="px-6 py-16 text-center text-white" style={{ background: LOGISTICS.colors.navy }}>
        <div className="container mx-auto max-w-xl">
          <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-xl px-7 py-3.5 font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Work With Ample Logistics <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}
