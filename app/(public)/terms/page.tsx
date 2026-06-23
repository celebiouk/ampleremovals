import type { Metadata } from "next";
import { COMPANY_PHONE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms & Conditions | Ample Removals",
  description:
    "The terms and conditions for removals, man and van, house clearance and cleaning services provided by Ample Removals.",
};

/** Last reviewed — update whenever the terms change. */
const LAST_UPDATED = "23 June 2026";
const COMPANY_EMAIL = "info@ampleremovals.com";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-brand-purple-800 sm:text-2xl">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="bg-white">
      <div className="bg-gradient-to-b from-brand-purple-800 to-brand-purple-900 px-5 py-14 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-white/80">
            These terms govern the services provided by Ample Removals. Please read them carefully —
            by booking a service with us you agree to them.
          </p>
          <p className="mt-2 text-sm text-white/60">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-20">
        {/* Headline liability box */}
        <div className="mt-10 rounded-2xl border-2 border-brand-purple-200 bg-brand-purple-50 p-5">
          <p className="font-display font-bold text-brand-purple-800">Important — limit of our liability</p>
          <p className="mt-2 text-[15px] leading-7 text-slate-700">
            Where damage to your goods or property is caused <strong>solely and directly by our negligence
            (i.e. we are found to be 100% at fault)</strong>, our total liability to you for that damage is
            limited to a maximum of <strong>£100</strong>. This does not limit our liability for death or
            personal injury caused by our negligence, or anything else that cannot be limited by law. For
            cover above this amount you should arrange your own goods-in-transit or contents insurance.
          </p>
        </div>

        <Section n="1" title="Who we are">
          <p>
            &quot;Ample Removals&quot;, &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer to Ample
            Removals. &quot;You&quot; and &quot;your&quot; refer to the customer who books our services.
            You can contact us on <strong>{COMPANY_PHONE}</strong> or at{" "}
            <a className="text-brand-purple-700 underline" href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>.
          </p>
          <p>
            These terms apply to all of our services, including removals, man and van, house clearance, house
            cleaning and end-of-tenancy cleaning.
          </p>
        </Section>

        <Section n="2" title="Quotes, bookings, deposits & payment">
          <p>
            Quotes are based on the information you give us. If the job differs on the day (for example more
            items, restricted access, extra distance or additional time), the price may change and we will
            tell you before continuing where we reasonably can.
          </p>
          <p>
            A <strong>deposit</strong> may be required to confirm your booking. The deposit is deducted from
            the total price, and the balance is due as set out on your invoice — normally on or before
            completion of the job. We may decline to start or continue a job where payment due has not been
            made.
          </p>
          <p>
            We accept payment by bank transfer and card. Invoices are issued electronically. We may withhold
            delivery of goods until all sums properly due for the job have been paid.
          </p>
        </Section>

        <Section n="3" title="Cancellations & rescheduling">
          <p>
            You may cancel or reschedule by contacting us as early as possible:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>More than 48 hours&apos; notice:</strong> no cancellation charge; any deposit is refundable.</li>
            <li><strong>Less than 48 hours&apos; notice:</strong> the deposit may be retained to cover our costs.</li>
            <li><strong>On the day / failed access:</strong> the full price may be charged where we have attended or reserved the slot.</li>
          </ul>
          <p>Refunds, where due, are paid to your original payment method within 5 working days.</p>
        </Section>

        <Section n="4" title="Your responsibilities">
          <p>To help your move go smoothly and safely, you agree to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>own the goods, or have permission to move them;</li>
            <li>give us accurate addresses, contact details and access information (floors, lifts, stairs, narrow doorways, parking and any restrictions or permits);</li>
            <li>arrange and pay for suitable parking and any permits at both addresses;</li>
            <li>
              <strong>properly prepare and protect your items before we arrive</strong> — including packing
              boxes securely, wrapping/padding fragile and high-value items, dismantling flat-pack furniture
              where needed, emptying drawers and furniture, and defrosting and drying fridges/freezers;
            </li>
            <li>be present (or send a representative) at collection and delivery to direct and check the work, and to sign the proof of collection/delivery;</li>
            <li>tell us in advance about anything heavy, awkward, valuable or hazardous.</li>
          </ul>
          <p>
            If you ask us to move items that have not been adequately prepared or protected, or you instruct
            us to proceed against our advice, we may ask you to sign a <strong>liability waiver</strong> and
            we will not be liable for damage arising from that lack of preparation or those instructions.
          </p>
        </Section>

        <Section n="5" title="Our liability for goods & property">
          <p>
            We take great care with your belongings and your property. Where we are{" "}
            <strong>100% at fault</strong> for direct physical damage to an item or to property, our liability
            is limited to a maximum of <strong>£100</strong> (see the box above).
          </p>
          <p>We are not responsible for:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>items packed by you or a third party, or damage caused by inadequate packing or preparation;</li>
            <li>normal wear and tear, or pre-existing damage;</li>
            <li>fragile, brittle or sensitive items (glass, ceramics, screens, mirrors, mechanical/electrical malfunction) unless our negligence is proven;</li>
            <li>data loss, perishables, plants, animals, cash, jewellery, deeds, documents or items of unusual sentimental or collectible value;</li>
            <li>damage caused by you assisting with the lift/carry, or by moving against our advice;</li>
            <li>damage to property caused by the only practical route of access being tight or restricted;</li>
            <li>indirect or consequential loss, including loss of income, opportunity or sentimental value.</li>
          </ul>
        </Section>

        <Section n="6" title="Claims">
          <p>
            Any claim for loss or damage must be reported to us in writing within <strong>7 days</strong> of
            the collection or delivery date, with photographs and reasonable supporting evidence (such as proof
            of value). Items must be made available for inspection. Claims reported after this period may not
            be considered. Acceptance of any payment we offer is in full and final settlement of the claim.
          </p>
        </Section>

        <Section n="7" title="Items we will not move">
          <p>
            We do not transport illegal, stolen, dangerous or hazardous goods, or anything requiring a special
            licence without prior written agreement. If such items are presented without our knowledge, we may
            refuse or dispose of them and recover any costs from you, and you agree to indemnify us against any
            related penalties or losses.
          </p>
        </Section>

        <Section n="8" title="Delays & events outside our control">
          <p>
            We aim to arrive within the agreed window and keep you updated with live tracking. We are not
            liable for delays or non-performance caused by events beyond our reasonable control, including
            severe weather, traffic, road closures, accidents, breakdown, or acts of government.
          </p>
        </Section>

        <Section n="9" title="Complaints">
          <p>
            We want every move to go well. If something is not right, please contact us on{" "}
            <strong>{COMPANY_PHONE}</strong> or{" "}
            <a className="text-brand-purple-700 underline" href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>{" "}
            so we can put it right.
          </p>
        </Section>

        <Section n="10" title="General">
          <p>
            These terms are governed by the laws of England and Wales (and, where applicable to a job carried
            out there, the corresponding law of the relevant UK nation), and the courts of that jurisdiction
            have exclusive jurisdiction. Nothing in these terms affects your statutory rights as a consumer. If
            any part of these terms is found to be unenforceable, the remaining terms continue to apply.
          </p>
        </Section>
      </div>
    </main>
  );
}
