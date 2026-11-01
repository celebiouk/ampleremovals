"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/brands";

export interface BrandNavLink {
  label: string;
  href: string;
}

// standardBrandNavLinks() lives in brand-nav-links.ts, not here — this file
// has "use client" at the top, which turns every export (even a plain data
// function) into a client reference that can't be called directly from a
// Server Component.

/**
 * The brand page's own header — sticky on scroll, hamburger menu on mobile,
 * horizontal menu on desktop, with "Get a free Quote" always visible (it's
 * part of the sticky bar itself, not a separate floating pill). This is the
 * ONLY site chrome a visitor to a white-label brand sees — no link anywhere
 * in here points back to Ample Removals, by design: these brands are meant
 * to look fully independent.
 */
export function BrandNavbar({
  brand,
  logo,
  links,
  quoteHref,
}: {
  brand: Brand;
  /** A rendered logo element, not the component itself — a bare component
   *  function can't cross the server→client boundary, only JSX can. */
  logo: ReactNode;
  links: BrandNavLink[];
  quoteHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          {logo}
        </Link>

        {/* Desktop menu */}
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-slate-700 hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href={quoteHref}
            style={{ background: brand.colors.accent }}
            className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Get a free Quote <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={quoteHref}
            onClick={() => setOpen(false)}
            style={{ background: brand.colors.accent }}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white"
          >
            Get a free Quote <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </header>
  );
}

