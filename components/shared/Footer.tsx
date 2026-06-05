import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { AmpleLogo } from "@/components/shared/AmpleLogo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-purple-900 text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        {/* Company info */}
        <div className="space-y-4">
          <Link href="/" className="inline-flex">
            <AmpleLogo variant="white" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            Professional, fully insured removal and cleaning services across the
            UK. Your move, simplified.
          </p>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">
            Services
          </h3>
          <ul className="space-y-2.5">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/booking/${s.slug}`}
                  className="text-sm text-white/70 transition-colors hover:text-brand-green-400"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">
            Get in touch
          </h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-brand-green-400" />
              <a href="tel:+443300000000" className="hover:text-white">
                0330 000 0000
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-brand-green-400" />
              <a
                href="mailto:hello@ampleremovals.co.uk"
                className="hover:text-white"
              >
                hello@ampleremovals.co.uk
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-400" />
              <span>Covering Greater London &amp; the UK</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/60 sm:flex-row">
          <p>© {year} Ample Removals. All rights reserved.</p>
          <p className="flex gap-4">
            <Link href="/" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/" className="hover:text-white">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
