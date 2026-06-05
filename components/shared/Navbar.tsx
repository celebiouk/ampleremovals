"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Boxes, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES } from "@/lib/services";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
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

  const solid = scrolled || mobileOpen;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        solid
          ? "border-b border-brand-purple-100 bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container flex h-[72px] items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 group-hover:rotate-6",
              solid
                ? "bg-brand-purple-800 text-white"
                : "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur"
            )}
          >
            <Boxes className="h-5 w-5" />
          </span>
          <span
            className={cn(
              "font-display text-[1.35rem] font-extrabold tracking-tight transition-colors duration-500",
              solid ? "text-brand-purple-900" : "text-white"
            )}
          >
            Ample
            <span className={solid ? "text-brand-green-600" : "text-brand-green-400"}>
              .
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/booking/${s.slug}`}
              className={cn(
                "rounded-full px-4 py-2 text-[0.9rem] font-medium transition-colors",
                solid
                  ? "text-slate-600 hover:bg-brand-purple-50 hover:text-brand-purple-800"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {s.shortTitle}
            </Link>
          ))}
        </nav>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/booking/removals"
            className={cn(
              "group hidden items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5 sm:inline-flex",
              "bg-brand-green-600 text-white shadow-brand-green-600/30 hover:bg-brand-green-500 hover:shadow-brand-green-500/40"
            )}
          >
            Get a Quote
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors lg:hidden",
              solid
                ? "text-brand-purple-900 hover:bg-brand-purple-50"
                : "text-white hover:bg-white/10"
            )}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-brand-purple-50 hover:text-brand-purple-800"
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
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-green-600 px-5 py-3.5 text-base font-semibold text-white"
          >
            Get a Free Quote
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
