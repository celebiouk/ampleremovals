import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { LOCATIONS } from "@/lib/locations";
import { AmpleLogo } from "@/components/shared/AmpleLogo";

export function Footer() {
  const year = new Date().getFullYear();

  // Featured locations (top 12 most popular)
  const featuredLocations = LOCATIONS.filter((loc) =>
    ["london", "southampton", "portsmouth", "basingstoke", "reading", "oxford",
     "bristol", "bath", "bournemouth", "brighton", "guildford", "winchester"].includes(loc.slug)
  );

  return (
    <footer className="bg-brand-purple-900 text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
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

        {/* Service Locations */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">
            Service Areas
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-white/70">
            {featuredLocations.map((loc) => (
              <li key={loc.slug}>
                <Link
                  href={`/locations/${loc.slug}`}
                  className="hover:text-brand-green-400 transition-colors"
                >
                  {loc.name}
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
              <a href="tel:+447344683477" className="hover:text-white">
                07344 683477
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-brand-green-400" />
              <a
                href="mailto:hello@ampleremovals.com"
                className="hover:text-white"
              >
                hello@ampleremovals.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-400" />
              <span>Covering South England</span>
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
