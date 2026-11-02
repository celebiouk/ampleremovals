import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Truck, UserPlus, MessageCircle, Mail, Clock, MapPin } from "lucide-react";
import { LOGISTICS, BERKSHIRE_TOWNS, logisticsPageMetadata } from "@/lib/logistics";
import { GeneralContactForm } from "@/components/logistics/GeneralContactForm";

export const metadata: Metadata = logisticsPageMetadata(
  "Contact Us | Ample Logistics",
  "Whether you need HGV driver cover or want to register as a driver, our team welcomes your enquiry.",
  "/contact"
);

export default function ContactPage() {
  return (
    <>
      <section className="px-6 py-20 text-white" style={{ background: `linear-gradient(135deg, ${LOGISTICS.colors.navy}, ${LOGISTICS.colors.charcoal})` }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Let&apos;s Talk About Your Logistics Staffing Needs.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">Whether you need HGV driver cover or want to register as a driver, our team welcomes your enquiry.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <Truck className="mx-auto h-7 w-7" style={{ color: LOGISTICS.colors.blue }} />
            <h3 className="mt-3 font-display text-lg font-bold" style={{ color: LOGISTICS.colors.navy }}>Business Enquiries</h3>
            <p className="mt-2 text-sm text-slate-600">For companies looking for temporary or urgent HGV driver staffing.</p>
            <Link href="/businesses#request-form" className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Request a Driver <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <UserPlus className="mx-auto h-7 w-7" style={{ color: LOGISTICS.colors.blue }} />
            <h3 className="mt-3 font-display text-lg font-bold" style={{ color: LOGISTICS.colors.navy }}>Driver Registration</h3>
            <p className="mt-2 text-sm text-slate-600">For HGV drivers interested in assignments and work opportunities.</p>
            <Link href="/drivers#register-form" className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Register as a Driver <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <MessageCircle className="mx-auto h-7 w-7" style={{ color: LOGISTICS.colors.blue }} />
            <h3 className="mt-3 font-display text-lg font-bold" style={{ color: LOGISTICS.colors.navy }}>General Enquiries</h3>
            <p className="mt-2 text-sm text-slate-600">For questions about Ample Logistics and its services.</p>
            <a href="#enquiry-form" className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Send an Enquiry <ArrowRight className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </section>

      <section id="enquiry-form" className="px-6 py-16" style={{ background: LOGISTICS.colors.lightGrey }}>
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center" style={{ color: LOGISTICS.colors.navy }}>Send Us a Message</h2>
          <div className="mt-10 rounded-2xl bg-white p-6 sm:p-10">
            <GeneralContactForm />
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          <div className="text-center">
            <Mail className="mx-auto h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />
            <p className="mt-2 text-sm font-semibold" style={{ color: LOGISTICS.colors.navy }}>Business Email</p>
            <p className="mt-1 text-sm text-slate-600">{LOGISTICS.emailAddress}</p>
          </div>
          <div className="text-center">
            <Clock className="mx-auto h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />
            <p className="mt-2 text-sm font-semibold" style={{ color: LOGISTICS.colors.navy }}>Office Hours</p>
            <p className="mt-1 text-sm text-slate-600">To be confirmed</p>
          </div>
          <div className="text-center">
            <MapPin className="mx-auto h-5 w-5" style={{ color: LOGISTICS.colors.blue }} />
            <p className="mt-2 text-sm font-semibold" style={{ color: LOGISTICS.colors.navy }}>Service Area</p>
            <p className="mt-1 text-sm text-slate-600">{BERKSHIRE_TOWNS.slice(0, 4).join(", ")} and across Berkshire</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center text-white" style={{ background: LOGISTICS.colors.navy }}>
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold">Let&apos;s Get the Right People on the Road.</h2>
          <p className="mt-3 text-slate-300">Contact Ample Logistics to discuss your driver staffing requirements or register your interest in driving opportunities.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/businesses" className="inline-flex items-center gap-1.5 rounded-xl px-7 py-3.5 font-bold text-white" style={{ background: LOGISTICS.colors.blue }}>Request a Driver</Link>
            <Link href="/drivers" className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 px-7 py-3.5 font-semibold text-white hover:bg-white/10">Find Driving Work</Link>
          </div>
        </div>
      </section>
    </>
  );
}
