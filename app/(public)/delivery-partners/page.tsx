import { Metadata } from "next";
import { Truck, PackageCheck, Clock, ShieldCheck } from "lucide-react";
import { breadcrumbSchema } from "@/lib/breadcrumb-schema";
import { DeliveryEnquiryForm } from "@/components/shared/DeliveryEnquiryForm";

export const metadata: Metadata = {
  title: "Delivery & Collection Partnerships for Local Businesses | Ample Removals",
  description:
    "Luton van delivery and collection support for furniture retailers, couriers, warehouses and other businesses around Thatcham and Newbury — flexible, honest, one van at a time.",
  alternates: { canonical: "https://www.ampleremovals.com/delivery-partners" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbSchema([
      { name: "Home", url: "https://www.ampleremovals.com" },
      { name: "Delivery Partnerships", url: "https://www.ampleremovals.com/delivery-partners" },
    ]),
  ],
};

const POINTS = [
  { icon: Truck, title: "A dedicated Luton van", body: "Bulky-item friendly — sofas, appliances, pallets, office furniture — handled properly, not squeezed into a car." },
  { icon: Clock, title: "Fits around your schedule", body: "One-off overflow runs or a regular weekly slot — we flex to what your business actually needs." },
  { icon: ShieldCheck, title: "Honest about capacity", body: "We're upfront that this is currently one van. If a job needs more than that, we'll tell you rather than overpromise." },
  { icon: PackageCheck, title: "Careful handling", body: "The same crew standards we use on house removals — protected items, no damage, no drama." },
];

export default function LogisticsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-b from-brand-purple-50 to-white pb-16 pt-28 lg:pb-20 lg:pt-36">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="mb-3 font-bold uppercase tracking-[0.18em] text-brand-green-600">For local businesses</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-purple-950 sm:text-5xl">
            Need a van and a reliable team for deliveries or collections?
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Ample Removals runs delivery and collection support for furniture retailers, appliance
            shops, couriers, warehouses and other local businesses around Thatcham and Newbury —
            subcontracted capacity when your own fleet is stretched, without you taking on another van or driver.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-100 p-6">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple-50 text-brand-purple-800">
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-lg font-bold text-brand-purple-950">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-purple-50 py-16">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-bold text-brand-purple-950">Tell us what you need</h2>
            <p className="mt-2 text-slate-600">A few details and we&apos;ll come back to you to talk through your delivery or collection requirements.</p>
          </div>
          <DeliveryEnquiryForm />
        </div>
      </section>
    </>
  );
}
