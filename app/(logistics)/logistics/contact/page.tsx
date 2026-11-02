import type { Metadata } from "next";
import { Truck, UserPlus, MessageCircle, Mail, Clock, MapPin, Phone } from "lucide-react";
import { LOGISTICS, BERKSHIRE_TOWNS, logisticsPageMetadata } from "@/lib/logistics";
import { GeneralContactForm } from "@/components/logistics/GeneralContactForm";
import { PageHero, SectionHeading, PrimaryButton, GhostButton } from "@/components/logistics/LogisticsKit";
import { FadeIn } from "@/components/logistics/FadeIn";

export const metadata: Metadata = logisticsPageMetadata(
  "Contact Us | Ample Logistics",
  "Whether you need HGV driver cover or want to register as a driver, our team welcomes your enquiry.",
  "/contact"
);

const ROUTES = [
  { icon: Truck, title: "Business Enquiries", body: "For companies looking for temporary or urgent HGV driver staffing.", href: "/businesses#request-form", label: "Request a Driver" },
  { icon: UserPlus, title: "Driver Registration", body: "For HGV drivers interested in assignments and work opportunities.", href: "/drivers#register-form", label: "Register as a Driver" },
  { icon: MessageCircle, title: "General Enquiries", body: "For questions about Ample Logistics and its services.", href: "#enquiry-form", label: "Send an Enquiry" },
];

const DETAILS = [
  { icon: Phone, label: "Telephone", value: LOGISTICS.phone, href: LOGISTICS.phoneHref },
  { icon: Mail, label: "Business Email", value: LOGISTICS.emailAddress },
  { icon: Clock, label: "Office Hours", value: "To be confirmed" },
  { icon: MapPin, label: "Service Area", value: `${BERKSHIRE_TOWNS.slice(0, 4).join(", ")} and across Berkshire` },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title={<>Let&apos;s Talk About<br />Your Staffing Needs.</>}
        subtitle="Whether you need HGV driver cover or want to register as a driver, our team welcomes your enquiry."
      />

      <section className="px-6 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-x-10 sm:grid-cols-3">
            {ROUTES.map((r, i) => (
              <FadeIn key={r.title} delay={i * 0.08}>
                <div className="border-t py-6 sm:border-t-0 sm:border-l sm:pl-6 sm:first:border-l-0 sm:first:pl-0" style={{ borderColor: LOGISTICS.colors.line }}>
                  <r.icon className="h-6 w-6" style={{ color: LOGISTICS.colors.blue }} />
                  <h3 className="mt-3 text-lg font-bold" style={{ fontFamily: "var(--font-logistics-display)", color: LOGISTICS.colors.ink }}>{r.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{r.body}</p>
                  <a href={r.href} className="mt-4 inline-flex text-sm font-bold uppercase tracking-wide" style={{ color: LOGISTICS.colors.blue }}>{r.label} →</a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="enquiry-form" className="px-6 py-24" style={{ background: LOGISTICS.colors.ink }}>
        <div className="container mx-auto max-w-3xl">
          <SectionHeading eyebrow="Send a Message" title="General Enquiry" dark align="center" />
          <div className="mt-10 bg-white p-6 sm:p-10">
            <GeneralContactForm />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="container mx-auto grid max-w-5xl gap-x-10 sm:grid-cols-4">
          {DETAILS.map((d) => (
            <div key={d.label} className="border-t py-5 text-left sm:border-t-0" style={{ borderColor: LOGISTICS.colors.line }}>
              <d.icon className="h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-logistics-mono)", color: LOGISTICS.colors.ink }}>{d.label}</p>
              {d.href ? (
                <a href={d.href} className="mt-1 block text-sm text-slate-600 hover:underline">{d.value}</a>
              ) : (
                <p className="mt-1 text-sm text-slate-600">{d.value}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-20 text-center text-white" style={{ background: LOGISTICS.colors.ink }}>
        <div className="container relative mx-auto max-w-2xl">
          <SectionHeading eyebrow="Get Started" title="Let's Get The Right People On The Road." body="Contact Ample Logistics to discuss your driver staffing requirements or register your interest in driving opportunities." dark align="center" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href="/businesses">Request a Driver</PrimaryButton>
            <GhostButton href="/drivers">Find Driving Work</GhostButton>
          </div>
        </div>
      </section>
    </>
  );
}
