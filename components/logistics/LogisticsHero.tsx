"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone, ShieldCheck, MapPin, Clock3 } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export function LogisticsHero() {
  return (
    <section className="relative overflow-hidden px-6 py-28 text-white" style={{ background: `linear-gradient(160deg, ${LOGISTICS.colors.navy} 0%, ${LOGISTICS.colors.charcoal} 65%, #1a0533 100%)` }}>
      {/* Abstract route-line + gradient mesh backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full blur-3xl" style={{ background: LOGISTICS.colors.blue, opacity: 0.25 }} />
        <div className="absolute -right-10 top-1/3 h-80 w-80 rounded-full blur-3xl" style={{ background: "#a855f7", opacity: 0.2 }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="none">
          <path d="M-50 500 C 250 420, 350 540, 600 460 S 950 300, 1250 360" stroke={LOGISTICS.colors.blue} strokeWidth="2" strokeDasharray="8 10" opacity="0.35" />
          <path d="M-50 150 C 200 220, 420 80, 650 170 S 980 260, 1250 120" stroke="#a855f7" strokeWidth="2" strokeDasharray="8 10" opacity="0.25" />
        </svg>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="container relative mx-auto max-w-4xl text-center"
      >
        <motion.span
          variants={item}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-sm"
        >
          Part of the Ample Removals Group
        </motion.span>

        <motion.h1 variants={item} className="font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
          Reliable HGV Drivers<br className="hidden sm:block" /> When Your Business Needs Them.
        </motion.h1>

        <motion.p variants={item} className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Ample Logistics connects businesses across Berkshire England with qualified HGV drivers for temporary cover, urgent staffing requirements, and flexible logistics support.
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1.5 rounded-xl px-7 py-3.5 font-bold text-white shadow-[0_8px_30px_rgba(22,163,74,0.4)] transition-transform hover:-translate-y-0.5"
            style={{ background: LOGISTICS.colors.blue }}
          >
            Request a Driver <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/drivers" className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 px-7 py-3.5 font-semibold text-white hover:bg-white/10">
            Find Driving Work
          </Link>
          <a href={LOGISTICS.phoneHref} className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-slate-200 hover:bg-white/5">
            <Phone className="h-4 w-4" /> {LOGISTICS.phone}
          </a>
        </motion.div>

        <motion.div variants={item} className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-300">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} /> Driver compliance checks on every assignment</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} /> Covering all of Berkshire</span>
          <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} /> Urgent requests prioritised</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
