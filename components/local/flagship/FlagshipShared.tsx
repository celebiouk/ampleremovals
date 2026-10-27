import Link from "next/link";
import { Phone, Mail, MapPin, ArrowRight, ShieldCheck, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

export const COMPANY_ADDRESS = "41 Rosedale Garden, Thatcham, RG19 3LE";
export const COMPANY_PHONE_DISPLAY = "0333 577 2070";
export const COMPANY_PHONE_HREF = "tel:03335772070";
export const COMPANY_EMAIL = "hello@ampleremovals.com";

export interface Guide {
  title: string;
  intro: string;
  paragraphs: string[];
}

/** Trust bar used on both flagship pages — the four facts the owner confirmed
 *  are true and wants emphasised: 7 years, based in Thatcham, fully insured,
 *  committed/local (not a call centre). */
export function TrustBar() {
  const items = [
    { icon: Clock, label: "7+ years serving Newbury & Thatcham" },
    { icon: MapPin, label: "Based right here in Thatcham" },
    { icon: ShieldCheck, label: "Fully insured, every job" },
    { icon: Award, label: "A local team, not a call centre" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
          <it.icon className="h-6 w-6 text-brand-green-300" />
          <p className="text-xs font-semibold leading-snug text-white sm:text-sm">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

export function GuideArticle({ guide, headingLevel = "h3" }: { guide: Guide; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <Heading className="font-display text-xl font-bold text-slate-900 sm:text-2xl">{guide.title}</Heading>
      <p className="mt-3 text-slate-700">{guide.intro}</p>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
        {guide.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </article>
  );
}

export function ContactSection({ town, whatsappMessage }: { town: string; whatsappMessage: string }) {
  return (
    <section className="bg-slate-900 px-6 py-16 text-white">
      <div className="container mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold">Talk to a real person, today</h2>
          <p className="mt-3 text-slate-300">
            No call centre, no chatbot — when you call or message Ample Removals about your {town} move, you&apos;re talking to the same local team that&apos;ll turn up on the day.
          </p>
          <div className="mt-6 space-y-4">
            <a href={COMPANY_PHONE_HREF} className="flex items-center gap-3 text-lg font-semibold hover:text-brand-green-400">
              <Phone className="h-5 w-5 text-brand-green-400" /> {COMPANY_PHONE_DISPLAY}
            </a>
            <a href={`mailto:${COMPANY_EMAIL}`} className="flex items-center gap-3 text-lg font-semibold hover:text-brand-green-400">
              <Mail className="h-5 w-5 text-brand-green-400" /> {COMPANY_EMAIL}
            </a>
            <p className="flex items-start gap-3 text-base text-slate-300">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-green-400" /> {COMPANY_ADDRESS}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-green-600 hover:bg-brand-green-500">
              <Link href="/booking">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <WhatsAppButton message={whatsappMessage} />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border-2 border-slate-700">
          <iframe
            title={`Ample Removals — map of ${town} and the surrounding area`}
            src="https://maps.google.com/maps?q=RG19%203LE%20Thatcham&z=11&output=embed"
            className="h-full min-h-[320px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ title, faqs }: { title: string; faqs: { q: string; a: string }[] }) {
  return (
    <section className="bg-slate-50 px-6 py-16">
      <div className="container mx-auto max-w-3xl">
        <h2 className="font-display text-3xl font-bold text-slate-900">{title}</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-semibold text-slate-900">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
