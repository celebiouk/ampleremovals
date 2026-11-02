"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Phone } from "lucide-react";
import { LOGISTICS, LICENCE_CATEGORIES } from "@/lib/logistics";
import { Eyebrow, PrimaryButton, GhostButton, Tag } from "@/components/logistics/LogisticsKit";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const MANIFEST = [
  { label: "Coverage", value: "Berkshire, England" },
  { label: "Priority", value: "Urgent requests first" },
  { label: "Checks", value: "Licence + CPC verified" },
];

/**
 * The homepage hero — an asymmetric "despatch board" layout rather than a
 * centred gradient hero: a near-black ink panel, a condensed industrial
 * headline, and a manifest-style data strip on the right standing in for
 * the stat tiles a SaaS hero would use (without inventing numbers we
 * don't have — these are coverage/process facts, not metrics).
 */
export function LogisticsHero() {
  return (
    <section className="relative overflow-hidden text-white" style={{ background: LOGISTICS.colors.ink }}>
      {/* Hazard-stripe texture, confined to a thin top rule and corner mark — not a background wash */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundImage: `repeating-linear-gradient(135deg, ${LOGISTICS.colors.blue} 0 14px, ${LOGISTICS.colors.navy} 14px 28px)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-24 h-[480px] w-[480px] opacity-[0.06]"
        style={{ backgroundImage: `repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 26px)` }}
      />

      <div className="container relative mx-auto grid max-w-6xl gap-16 px-6 py-24 lg:grid-cols-[1.3fr_0.7fr] lg:py-32">
        <motion.div initial="hidden" animate="show" variants={container}>
          <motion.div variants={item}>
            <Eyebrow dark>HGV Driver Agency — Berkshire, England</Eyebrow>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-[clamp(2.75rem,9vw,4.75rem)] font-black uppercase leading-[0.92] tracking-tight"
            style={{ fontFamily: "var(--font-logistics-display)" }}
          >
            Drivers On
            <br />
            <span style={{ color: LOGISTICS.colors.blue }}>The Road,</span>
            <br />
            Not On Hold.
          </motion.h1>

          <motion.p variants={item} className="mt-7 max-w-lg text-lg text-white/65">
            Ample Logistics connects businesses across Berkshire with qualified HGV drivers for temporary cover, urgent staffing, and flexible logistics support.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryButton href="/businesses">Request a Driver</PrimaryButton>
            <GhostButton href="/drivers">Find Driving Work</GhostButton>
          </motion.div>

          <motion.a
            variants={item}
            href={LOGISTICS.phoneHref}
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
          >
            <Phone className="h-4 w-4" style={{ color: LOGISTICS.colors.blue }} />
            {LOGISTICS.phone}
          </motion.a>
        </motion.div>

        {/* Manifest sidebar — a despatch-board stat strip, not a stock photo */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="self-start border-t pt-6 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-1"
          style={{ borderColor: LOGISTICS.colors.lineOnDark }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "var(--font-logistics-mono)" }}>
            Manifest — 001
          </p>
          <div className="mt-4 space-y-4">
            {MANIFEST.map((m) => (
              <div key={m.label} className="border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: LOGISTICS.colors.lineOnDark }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40" style={{ fontFamily: "var(--font-logistics-mono)" }}>
                  {m.label}
                </p>
                <p className="mt-1 text-base font-semibold text-white">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {LICENCE_CATEGORIES.slice(0, 3).map((c) => (
              <Tag key={c.value} dark>{c.value}</Tag>
            ))}
          </div>
          <Link href="/about" className="mt-6 inline-block text-sm font-bold uppercase tracking-wide text-white/50 hover:text-white">
            Part of the Ample Removals group →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
