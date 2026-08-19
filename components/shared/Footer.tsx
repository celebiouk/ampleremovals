import Link from "next/link";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { LOCATIONS } from "@/lib/locations";
import { AmpleLogo } from "@/components/shared/AmpleLogo";
import { OPENING_HOURS, SOCIAL_LINKS } from "@/lib/company";

// Brand icons (lucide no longer ships these) — small inline SVGs.
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
  </svg>
);
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
  </svg>
);

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
          {/* Social */}
          <div className="flex items-center gap-3 pt-1">
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Ample Removals on Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-green-500">
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="Ample Removals on TikTok"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-green-500">
              <TikTokIcon className="h-4 w-4" />
            </a>
          </div>
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
              <a href="tel:+443335772070" className="hover:text-white">
                0333 577 2070
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
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-400" />
              <div>
                <p className="mb-1 font-semibold text-white/90">Opening hours</p>
                {OPENING_HOURS.map((h) => (
                  <p key={h.days} className="flex justify-between gap-4">
                    <span>{h.days}</span><span className="text-white/60">{h.time}</span>
                  </p>
                ))}
              </div>
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
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
