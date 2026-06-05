"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  BadgeCheck,
  Receipt,
  Star,
  Sparkles,
  ClipboardList,
  PhoneCall,
  Boxes,
  MapPin,
} from "lucide-react";
import { HeroTruck } from "@/components/shared/HeroTruck";
import { SERVICES } from "@/lib/services";

/* ── Motion variants ──────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

const inView = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: EASE },
};

/* ── Static content ───────────────────────────────────────── */
const STATS = [
  { value: "12k+", label: "Moves completed" },
  { value: "4.9★", label: "Average rating" },
  { value: "100%", label: "Insured & vetted" },
  { value: "48hr", label: "Avg. quote-to-book" },
];

const AREAS = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Bristol",
  "Liverpool",
  "Glasgow",
  "Sheffield",
  "Nationwide",
];

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "Tell us about your move",
    description:
      "Answer a few quick questions and get an instant indicative quote — no payment details, no pressure.",
  },
  {
    icon: PhoneCall,
    title: "We review & confirm",
    description:
      "A real person checks the details, answers your questions and locks in a fixed, transparent price.",
  },
  {
    icon: Boxes,
    title: "Move day, handled",
    description:
      "A vetted, fully insured crew arrives on time and takes care of everything, end to end.",
  },
];

const WHY_US = [
  {
    icon: ShieldCheck,
    title: "Fully Insured",
    description: "Goods-in-transit & public liability cover on every single job.",
  },
  {
    icon: BadgeCheck,
    title: "Vetted Professionals",
    description: "Background-checked, trained movers and cleaners — never a gamble.",
  },
  {
    icon: Receipt,
    title: "Transparent Pricing",
    description: "Fixed quotes agreed up front. No hidden fees, no move-day surprises.",
  },
  {
    icon: Star,
    title: "5-Star Rated",
    description: "Thousands of happy customers across the UK and a 4.9 average.",
  },
];

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Parallax: background drifts slower, artwork floats up.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const artY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <>
      {/* ════════════════ HERO ════════════════ */}
      <section
        ref={heroRef}
        className="grain relative flex min-h-screen items-center overflow-hidden"
      >
        {/* parallax mesh background */}
        <motion.div
          style={{ y: bgY }}
          className="mesh-aubergine absolute inset-0 -z-10 scale-110"
        />
        <div className="bg-grid-pattern absolute inset-0 -z-10 opacity-50" />
        {/* glow accents */}
        <div className="absolute -left-40 top-20 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand-purple-500/30 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-brand-green-600/20 blur-[120px]" />

        <motion.div
          style={{ opacity: heroFade }}
          className="container relative grid items-center gap-12 pb-28 pt-32 lg:grid-cols-[1.1fr_0.9fr]"
        >
          {/* Left: copy */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.span
              variants={rise}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur"
            >
              <span className="flex -space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-4 w-4 rounded-full border border-brand-purple-900 bg-gradient-to-br from-brand-green-400 to-brand-green-600"
                  />
                ))}
              </span>
              Trusted by 12,000+ UK movers
            </motion.span>

            <motion.h1
              variants={rise}
              className="mt-7 font-display text-[clamp(3rem,8.5vw,8rem)] font-extrabold leading-[0.9] tracking-[-0.03em] text-white"
            >
              Your move,
              <br />
              <span className="text-gradient-green">simplified.</span>
            </motion.h1>

            <motion.p
              variants={rise}
              className="mt-7 max-w-md text-lg leading-relaxed text-white/70"
            >
              Premium removals, clearances and cleaning across the UK — fully
              insured, fairly priced, and genuinely stress-free. Get your quote
              in minutes.
            </motion.p>

            <motion.div
              variants={rise}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/booking/removals"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-green-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-brand-green-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-green-500 hover:shadow-2xl hover:shadow-brand-green-500/40"
              >
                Get a Free Quote
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-white/10"
              >
                Explore services
              </Link>
            </motion.div>

            <motion.div
              variants={rise}
              className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/60"
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-green-400" /> Fully
                insured
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-green-400" /> No deposit
                to quote
              </span>
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 fill-brand-green-400 text-brand-green-400" />{" "}
                4.9 / 5 rated
              </span>
            </motion.div>
          </motion.div>

          {/* Right: architectural artwork */}
          <motion.div
            style={{ y: artY }}
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <HeroTruck className="w-full max-w-xl" />
          </motion.div>
        </motion.div>

        {/* overlapping stats bar — bridges hero into services */}
        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-1/2">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="glass grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/60 shadow-2xl shadow-brand-purple-900/20 md:grid-cols-4"
            >
              {STATS.map((s) => (
                <div key={s.label} className="bg-white/60 px-6 py-7 text-center">
                  <p className="font-display text-3xl font-extrabold text-brand-purple-900 sm:text-4xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ SERVICES ════════════════ */}
      <section id="services" className="bg-brand-purple-50 pb-28 pt-44 lg:pt-52">
        <div className="container">
          <motion.div {...inView} className="mb-16 max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-brand-purple-700">
              <span className="h-px w-8 bg-brand-green-600" /> What we do
            </p>
            <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-brand-purple-950 sm:text-6xl">
              One team for every
              <br />
              <span className="text-brand-green-600">stage of the move.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: (i % 3) * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={i % 2 === 1 ? "lg:translate-y-7" : ""}
              >
                <Link
                  href={`/booking/${s.slug}`}
                  className="group glass relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-white/70 p-7 shadow-lg shadow-brand-purple-900/5 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-purple-200 hover:shadow-2xl hover:shadow-brand-purple-800/15"
                >
                  {/* hover glow */}
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-green-400/0 blur-3xl transition-all duration-500 group-hover:bg-brand-green-400/25" />

                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple-700 to-brand-purple-900 text-white shadow-lg shadow-brand-purple-800/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <s.icon className="h-8 w-8" />
                  </span>

                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold text-brand-purple-950">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">
                      {s.description}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-700">
                    Get a quote
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}

            {/* CTA tile */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:translate-y-7"
            >
              <Link
                href="/booking/removals"
                className="grain group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-brand-purple-800 to-brand-purple-950 p-7 text-white shadow-xl shadow-brand-purple-900/30 transition-all duration-500 hover:-translate-y-1.5"
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-green-600/30 blur-2xl" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <Sparkles className="h-8 w-8 text-brand-green-400" />
                </span>
                <div className="relative mt-5">
                  <h3 className="font-display text-xl font-bold">
                    Not sure what you need?
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-white/70">
                    Start a quote and we&apos;ll guide you to the right service.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-400">
                    Start now
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="relative overflow-hidden bg-white py-28">
        <div className="container">
          <motion.div {...inView} className="mb-20 max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-brand-green-600">
              <span className="h-px w-8 bg-brand-purple-800" /> Simple &amp;
              stress-free
            </p>
            <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-brand-purple-950 sm:text-6xl">
              Three steps. Zero hassle.
            </h2>
          </motion.div>

          <div className="relative grid gap-x-8 gap-y-16 md:grid-cols-3">
            {/* animated connecting path (desktop) */}
            <svg
              className="absolute left-0 right-0 top-12 hidden h-2 w-full md:block"
              preserveAspectRatio="none"
              viewBox="0 0 100 2"
            >
              <motion.line
                x1="8"
                y1="1"
                x2="92"
                y2="1"
                stroke="#d8b4fe"
                strokeWidth="2"
                strokeDasharray="3 3"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              />
            </svg>

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative"
              >
                {/* oversized ghost number */}
                <span className="pointer-events-none absolute -top-10 right-0 select-none font-display text-[8rem] font-extrabold leading-none text-brand-purple-100">
                  {`0${i + 1}`}
                </span>

                <div className="relative">
                  <span className="relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-brand-purple-900 text-white shadow-xl shadow-brand-purple-900/25">
                    <step.icon className="h-7 w-7" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-green-600 text-xs font-bold text-white ring-4 ring-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-7 font-display text-2xl font-bold text-brand-purple-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-[0.98rem] leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ AREAS MARQUEE ════════════════ */}
      <section className="border-y border-brand-purple-100 bg-brand-purple-50 py-7">
        <div className="mask-fade-x flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...AREAS, ...AREAS].map((area, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 whitespace-nowrap font-display text-xl font-bold text-brand-purple-300"
              >
                <MapPin className="h-4 w-4 text-brand-green-500" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ WHY US (dark band) ════════════════ */}
      <section className="grain relative overflow-hidden bg-brand-purple-950 py-28">
        <div className="mesh-aubergine absolute inset-0 -z-10 opacity-80" />
        <div className="bg-grid-pattern absolute inset-0 -z-10 opacity-40" />
        <div className="container">
          <motion.div {...inView} className="mb-16 max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-brand-green-400">
              <span className="h-px w-8 bg-brand-green-400" /> The Ample
              difference
            </p>
            <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl">
              Premium, without
              <br />
              the premium drama.
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass-dark group rounded-3xl border border-white/10 p-7 transition-all duration-500 hover:border-brand-green-400/40 hover:bg-brand-purple-800/40"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green-600/15 text-brand-green-400 ring-1 ring-brand-green-400/20 transition-transform duration-500 group-hover:scale-110">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="bg-white py-24">
        <div className="container">
          <motion.div
            {...inView}
            className="grain relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-purple-800 via-brand-purple-900 to-brand-purple-950 px-8 py-20 text-center shadow-2xl shadow-brand-purple-900/30 sm:px-16"
          >
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-green-600/20 blur-3xl" />
            <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-purple-500/30 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">
                Ready to get moving?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
                Free, no-obligation quotes in minutes. No payment details
                required — just tell us about your move.
              </p>
              <Link
                href="/booking/removals"
                className="group mt-9 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-green-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-brand-green-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-green-500"
              >
                Start your free quote
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
