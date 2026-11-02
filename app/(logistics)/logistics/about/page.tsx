import type { Metadata } from "next";
import { ShieldCheck, Clock, MessageSquareText, Handshake, FileCheck2, UserCheck, IdCard, Gauge } from "lucide-react";
import { LOGISTICS, logisticsPageMetadata } from "@/lib/logistics";
import { PageHero, SectionHeading, ManifestRow, PrimaryButton } from "@/components/logistics/LogisticsKit";
import { FadeIn } from "@/components/logistics/FadeIn";

export const metadata: Metadata = logisticsPageMetadata(
  "About Us | Ample Logistics",
  "Ample Logistics helps bridge the gap between businesses that need HGV drivers and drivers seeking suitable work opportunities across Berkshire England.",
  "/about"
);

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
      <PageHero
        eyebrow="About Us"
        title={<>Connecting Drivers<br />With Businesses That<br />Keep Britain Moving.</>}
        subtitle="Ample Logistics helps bridge the gap between businesses that need HGV drivers and drivers seeking suitable work opportunities across Berkshire England."
      />

      <section className="px-6 py-20">
        <div className="container mx-auto grid max-w-5xl gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="Our Story" title="Why We Exist" />
          <div className="space-y-4 text-slate-700">
            <p>At Ample Logistics, we understand how important reliable driver staffing is to transport and logistics operations. When a shift needs covering or demand increases unexpectedly, businesses need a straightforward way to communicate their requirements and find suitable drivers.</p>
            <p>Our focus is to connect businesses with appropriately qualified drivers through clear communication, careful matching, and practical staffing support.</p>
            <p>We also help drivers express their interest in temporary assignments and potential ongoing opportunities that match their qualifications, experience, and availability.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center" style={{ background: LOGISTICS.colors.ink }}>
        <div className="container mx-auto max-w-2xl">
          <SectionHeading eyebrow="Our Mission" title="A Straightforward Way To Staff HGV Drivers" body="To make HGV driver staffing more straightforward by connecting businesses with suitable drivers and helping drivers access relevant work opportunities." dark align="center" />
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="container mx-auto max-w-5xl">
          <SectionHeading eyebrow="Our Values" title="How We Operate" align="center" />
          <div className="mx-auto mt-12 grid max-w-3xl gap-x-10 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <ManifestRow key={v.title} index={i + 1} title={v.title} body={v.body} icon={<v.icon className="h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-3xl">
          <SectionHeading eyebrow="Compliance" title="Our Approach To Driver Checks" body="Driver suitability depends on the requirements of the assignment. Depending on the role, this may include:" />
          <div className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {CHECKS.map((c, i) => (
              <FadeIn key={c.label} delay={i * 0.04}>
                <div className="flex items-start gap-3 border-t py-3.5 text-sm text-slate-700" style={{ borderColor: LOGISTICS.colors.line }}>
                  <c.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LOGISTICS.colors.blue }} />
                  {c.label}
                </div>
              </FadeIn>
            ))}
          </div>
          <p className="mt-5 text-xs text-slate-400" style={{ fontFamily: "var(--font-logistics-mono)" }}>All checks are carried out in accordance with applicable UK legislation and data protection requirements.</p>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <div className="container mx-auto max-w-2xl">
          <SectionHeading eyebrow="Service Area" title="Covering Berkshire" body="Ample Logistics aims to support businesses across Berkshire England, subject to confirmed coverage and driver availability." align="center" />
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-16 text-center" style={{ background: LOGISTICS.colors.ink }}>
        <div className="container relative mx-auto max-w-xl">
          <PrimaryButton href="/contact">Work With Ample Logistics</PrimaryButton>
        </div>
      </section>
    </>
  );
}
