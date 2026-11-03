"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Menu, Phone, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/brands";
import type { BrandNavLink } from "@/components/local/multibrand/BrandNavbar";

/** Sticky header: paper bar, heavy ink underline like a kerbside, red quote block. */
export function ManyVansHeader({
  brand,
  logo,
  homeHref,
  links,
  quoteHref,
}: {
  brand: Brand;
  logo: ReactNode;
  homeHref: string;
  links: BrandNavLink[];
  quoteHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[var(--mv-ink)] bg-[var(--mv-ground)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link href={homeHref} className="shrink-0" onClick={() => setOpen(false)}>
          {logo}
        </Link>

        <nav className="hidden items-center gap-6 xl:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mv-tab whitespace-nowrap border-b-[3px] border-transparent py-1 text-[11px] text-[var(--mv-ink)] transition-colors hover:border-[var(--mv-red)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          <a href={brand.phoneHref} className="mv-num hidden items-center gap-2 whitespace-nowrap text-sm font-bold text-[var(--mv-ink)] 2xl:flex">
            <Phone className="h-4 w-4 text-[var(--mv-red)]" /> {brand.phone}
          </a>
          <Link
            href={quoteHref}
            className="mv-tab inline-flex items-center gap-2 whitespace-nowrap bg-[var(--mv-red)] px-5 py-3 text-[11px] text-white transition-colors hover:bg-[var(--mv-ink)]"
          >
            Get a free quote <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 p-2 text-[var(--mv-ink)] xl:hidden"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div className="border-t-[3px] border-[var(--mv-ink)] bg-[var(--mv-ink)] px-5 pb-6 pt-2 xl:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="mv-display flex items-baseline gap-3 border-b border-white/15 py-3.5 text-[1.7rem] text-white"
              >
                <span className="mv-num text-xs font-bold text-[var(--mv-red)]">{String(i + 1).padStart(2, "0")}</span>
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={quoteHref}
            onClick={() => setOpen(false)}
            className="mv-tab mt-5 flex items-center justify-center gap-2 bg-[var(--mv-red)] px-5 py-4 text-xs text-white"
          >
            Get a free quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </header>
  );
}

export function ManyVansFooter({ brand, logo, links }: { brand: Brand; logo: ReactNode; logoOnDark?: ReactNode; links: BrandNavLink[] }) {
  return (
    <footer className="relative overflow-hidden bg-[var(--mv-ink)] text-white">
      <div className="mv-road" aria-hidden="true" />
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="inline-block bg-[var(--mv-ground)] px-4 py-3">{logo}</div>
          <p className="mt-6 max-w-sm text-white/70">
            {brand.tagline}. Removals, man and van and house clearance across {brand.towns.join(" & ")}.
          </p>
          <a href={brand.phoneHref} className="mv-display mv-num mt-6 block text-[clamp(1.9rem,4vw,3rem)] text-white hover:text-[var(--mv-red)]">
            {brand.phone}
          </a>
        </div>

        <nav className="lg:col-span-3" aria-label="Footer">
          <p className="mv-tab text-[11px] text-[var(--mv-red)]">Navigate</p>
          <ul className="mt-4 space-y-2.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-semibold text-white/80 hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className="mv-tab text-[11px] text-[var(--mv-red)]">Depot</p>
          <p className="mt-4 flex items-start gap-2 text-white/80">
            <MapPin className="mt-1 h-4 w-4 shrink-0" />
            {brand.address.line1}, {brand.address.town}, {brand.address.postcode}
          </p>
          <p className="mt-3 text-white/60">Fully insured on every job. Fixed price agreed before you book.</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-xs text-white/50 md:px-8">
        <p className="mx-auto max-w-7xl">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
