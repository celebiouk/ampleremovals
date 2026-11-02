"use client";

import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { trackQuoteClick, trackPhoneClick } from "@/lib/analytics/track";

/**
 * The bottom-of-page "Get a free Quote / WhatsApp / Call" CTA row shared by
 * BrandPageShell's closing CTA section and BrandContactPage's "Call" tile —
 * pulled out as its own client component (rather than inlined in those async
 * server components) purely so the click-tracking handlers have somewhere
 * to live without converting the whole page to a client component.
 */
export function ContactCtaRow({
  quoteHref,
  whatsappMessage,
  whatsappNumber,
  phone,
  phoneHref,
  accent,
  source,
}: {
  quoteHref: string;
  whatsappMessage: string;
  whatsappNumber: string;
  phone: string;
  phoneHref: string;
  accent: string;
  source: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Link
        href={quoteHref}
        onClick={() => trackQuoteClick(source)}
        style={{ background: accent }}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Get a free Quote <ArrowRight className="h-4 w-4" />
      </Link>
      <WhatsAppButton message={whatsappMessage} whatsappNumber={whatsappNumber} />
      <a
        href={phoneHref}
        onClick={() => trackPhoneClick(source)}
        className="inline-flex items-center gap-2 rounded-xl border border-white px-6 py-3 font-semibold hover:bg-white/10"
      >
        <Phone className="h-4 w-4" /> {phone}
      </a>
    </div>
  );
}
