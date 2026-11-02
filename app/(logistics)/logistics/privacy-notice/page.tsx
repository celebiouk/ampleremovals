import type { Metadata } from "next";
import { LOGISTICS, logisticsPageMetadata } from "@/lib/logistics";

export const metadata: Metadata = {
  ...logisticsPageMetadata("Privacy Notice | Ample Logistics", "Ample Logistics' privacy notice.", "/privacy-notice"),
  robots: { index: false, follow: true },
};

export default function PrivacyNoticePage() {
  return (
    <section className="px-6 py-16">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Draft notice — pending legal review.</strong> This is a working draft covering the data this
          site actually collects. It must be reviewed and approved by Ample Logistics before relying on it at launch.
        </div>
        <h1 className="font-display text-3xl font-bold" style={{ color: LOGISTICS.colors.navy }}>Privacy Notice</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>Ample Logistics collects personal information submitted through this website's forms — business driver
          requests, driver applications, and general enquiries — in order to respond to those requests, assess
          driver suitability for assignments, and communicate about staffing requirements.</p>
          <p><strong>What we collect:</strong> contact details (name, email, phone), company or location details for
          business requests, and licence, experience, availability and (optionally) CV information for driver
          applications.</p>
          <p><strong>Why we collect it:</strong> to assess and respond to your enquiry, match driver applications
          against business requirements, and maintain records of staffing requests and registrations.</p>
          <p><strong>Lawful basis:</strong> processing is generally necessary to take steps at your request before
          entering into a contract, or for our legitimate interests in operating a driver staffing enquiry service.
          Specific lawful bases are confirmed on review of our actual processing activities.</p>
          <p><strong>Retention:</strong> information is retained only as long as necessary for the purpose it was
          collected for, after which it is deleted or anonymised in line with our data retention procedures.</p>
          <p><strong>Your rights:</strong> you can ask to see, correct, or have deleted the information we hold about
          you by contacting us at {LOGISTICS.emailAddress}.</p>
          <p>Uploaded CVs are stored in private, access-controlled storage and are never made publicly accessible.</p>
        </div>
      </div>
    </section>
  );
}
