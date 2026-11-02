import type { Metadata } from "next";
import { LOGISTICS } from "@/lib/logistics";

export const metadata: Metadata = {
  title: "Terms and Conditions | Ample Logistics",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <section className="px-6 py-16">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Draft notice — pending legal review.</strong> Full terms of business for client contracts and driver
          engagement must be prepared and approved separately before launch. This page covers website use only.
        </div>
        <h1 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Terms and Conditions</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>This website is operated by Ample Logistics. Submitting a driver request, a driver application, or a
          general enquiry through this site does not, by itself, create any contract for services or employment —
          it registers your interest or requirement so our team can follow up.</p>
          <p>Driver registration does not guarantee an assignment, placement, or employment. Business driver
          requests are subject to driver availability and agreement of terms before any assignment is confirmed.</p>
          <p>Any assignment, placement, or staffing arrangement is governed by separate terms agreed directly between
          the parties involved, not by this website's terms of use.</p>
          <p>For questions about these terms, contact {LOGISTICS.emailAddress}.</p>
        </div>
      </div>
    </section>
  );
}
