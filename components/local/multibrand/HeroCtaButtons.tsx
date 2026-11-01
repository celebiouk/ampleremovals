import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

/** The 3-way CTA ("Get a free Quote" / WhatsApp / Call) rendered directly in
 *  the hero of a brand marketing page — the StickyQuoteBar covers the same
 *  3 actions while scrolling, this is the above-the-fold version. */
export function HeroCtaButtons({
  quoteHref,
  accent,
  whatsappMessage,
  whatsappNumber,
  phone,
  phoneHref,
  align = "start",
}: {
  quoteHref: string;
  accent: string;
  whatsappMessage: string;
  whatsappNumber: string;
  phone: string;
  phoneHref: string;
  align?: "start" | "center";
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${align === "center" ? "justify-center" : "justify-start"}`}>
      <Link
        href={quoteHref}
        style={{ background: accent }}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Get a free Quote <ArrowRight className="h-4 w-4" />
      </Link>
      <WhatsAppButton message={whatsappMessage} whatsappNumber={whatsappNumber} variant="outline" />
      <a href={phoneHref} className="inline-flex items-center gap-2 rounded-xl border border-white/70 px-6 py-3.5 font-semibold text-white hover:bg-white/10">
        <Phone className="h-4 w-4" /> {phone}
      </a>
    </div>
  );
}
