"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES } from "@/lib/services";
import { AmpleLogo } from "@/components/shared/AmpleLogo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-white transition-shadow duration-300",
        scrolled
          ? "border-brand-purple-100 shadow-[0_8px_30px_rgb(0,0,0,0.05)]"
          : "border-transparent"
      )}
    >
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <AmpleLogo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {SERVICES.map((s) => {
            const active = pathname === `/booking/${s.slug}`;
            return (
              <Link
                key={s.slug}
                href={`/booking/${s.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[0.92rem] font-semibold transition-colors",
                  active
                    ? "text-brand-purple-800"
                    : "text-slate-600 hover:bg-brand-purple-50 hover:text-brand-purple-800"
                )}
              >
                {s.shortTitle}
                {active && (
                  <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand-green-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+443335772070"
            className="hidden items-center gap-2 text-sm font-bold text-brand-purple-900 xl:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple-50 text-brand-purple-800">
              <Phone className="h-4 w-4" />
            </span>
            0333 577 2070
          </a>

          <Link
            href="/booking/removals"
            className="group hidden items-center gap-1.5 rounded-xl bg-brand-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-green-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-green-500 sm:inline-flex"
          >
            Get a quote
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple-800 text-white shadow-md shadow-brand-purple-800/30 transition-all duration-200 hover:bg-brand-purple-900 lg:hidden"
          >
            {mobileOpen ? (
              /* Bold X — green */
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <line x1="5" y1="5" x2="19" y2="19" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
                <line x1="19" y1="5" x2="5" y2="19" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              /* Thick three-line hamburger — white on purple */
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <line x1="3" y1="6"  x2="21" y2="6"  stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-x-0 top-[72px] z-40 origin-top overflow-hidden bg-white transition-[max-height,opacity] duration-300 lg:hidden",
          mobileOpen ? "max-h-[calc(100vh-72px)] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container flex flex-col gap-1 py-5">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/booking/${s.slug}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-brand-purple-50 hover:text-brand-purple-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-purple-100 text-brand-purple-800">
                <s.icon className="h-5 w-5" />
              </span>
              {s.title}
            </Link>
          ))}
          <Link
            href="/booking/removals"
            onClick={() => setMobileOpen(false)}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-green-600 px-5 py-3.5 text-base font-bold text-white"
          >
            Get a free quote
            <ArrowRight className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
