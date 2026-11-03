"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LOGISTICS } from "@/lib/logistics";
import { FadeIn } from "@/components/logistics/FadeIn";

/**
 * Ample Logistics' shared visual kit — the "despatch board" system.
 * Ink/paper surfaces with purple/green deployed as sharp signal accents
 * (never wall-to-wall gradients), condensed industrial display type,
 * monospace data tags, hairline rules instead of soft rounded cards.
 * Used across every Logistics page so the identity reads as one
 * considered system rather than five pages improvising separately.
 */

/** Small mono-caps label with a signal dot — "the despatch board voice". */
export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]"
      style={{ fontFamily: "var(--font-logistics-mono)", color: dark ? "rgba(255,255,255,0.65)" : "rgba(17,17,19,0.55)" }}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full" style={{ background: LOGISTICS.colors.blue, opacity: 0.6 }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: LOGISTICS.colors.blue }} />
      </span>
      {children}
    </span>
  );
}

/** Mono data-tag — used for licence categories, reference-style labels. */
export function Tag({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        fontFamily: "var(--font-logistics-mono)",
        borderColor: dark ? "rgba(255,255,255,0.25)" : LOGISTICS.colors.line,
        color: dark ? "rgba(255,255,255,0.85)" : LOGISTICS.colors.ink,
      }}
    >
      {children}
    </span>
  );
}

const btnBase = "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold uppercase tracking-wide transition-colors";

export function PrimaryButton({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = btnBase + " text-white hover:brightness-110";
  const style = { background: LOGISTICS.colors.blue };
  if (href?.startsWith("#") || href?.startsWith("tel:") || href?.startsWith("mailto:") || onClick) {
    return <a href={href} onClick={onClick} className={cls} style={style}>{children}</a>;
  }
  return <Link href={href ?? "#"} onClick={onClick} className={cls} style={style}>{children}</Link>;
}

export function GhostButton({ href, children, dark = true }: { href: string; children: ReactNode; dark?: boolean }) {
  const cls = btnBase + " border-2 transition-colors";
  const style = dark
    ? { borderColor: "rgba(255,255,255,0.35)", color: "#fff" }
    : { borderColor: LOGISTICS.colors.ink, color: LOGISTICS.colors.ink };
  if (href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return <a href={href} className={cls} style={style}>{children}</a>;
  }
  return <Link href={href} className={cls} style={style}>{children}</Link>;
}

/**
 * Shared dark hero for every interior page — a thin hazard-stripe corner
 * mark, a mono eyebrow, an oversized condensed headline, and an optional
 * manifest-style stat strip (replaces the generic centred gradient hero
 * every page used to repeat individually).
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  cta,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  cta?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-white" style={{ background: LOGISTICS.colors.ink }}>
      <HazardCorner />
      <svg aria-hidden="true" viewBox="0 0 420 200" className="pointer-events-none absolute right-6 top-1/2 hidden w-[380px] -translate-y-1/2 opacity-60 lg:block">
        <path d="M0 176 L90 146 L170 118 L270 78 L360 44 L420 24" fill="none" stroke={LOGISTICS.colors.blue} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 176 L90 146 L170 118 L270 78 L360 44 L420 24" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="7 7" strokeLinecap="round" strokeLinejoin="round" />
        {[[90, 146], [170, 118], [270, 78], [360, 44]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="6.5" fill={LOGISTICS.colors.ink} stroke="#fff" strokeWidth="2.5" />
        ))}
      </svg>
      <div className="container relative mx-auto max-w-4xl">
        <FadeIn>
          <Eyebrow dark>{eyebrow}</Eyebrow>
          <h1
            className="mt-5 text-5xl font-extrabold uppercase leading-[0.98] tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--font-logistics-display)" }}
          >
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/65">{subtitle}</p>
          {cta && <div className="mt-8 flex flex-wrap items-center gap-3">{cta}</div>}
        </FadeIn>
      </div>
    </section>
  );
}

/** Faint diagonal hazard-stripe corner mark — the one recurring texture motif. */
export function HazardCorner({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 opacity-[0.07] ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, ${LOGISTICS.colors.blue} 0 10px, transparent 10px 22px)`,
      }}
    />
  );
}

/** Numbered manifest row — replaces the generic "rounded-2xl border p-6" card. */
export function ManifestRow({
  index,
  title,
  body,
  icon,
}: {
  index: number | string;
  title: string;
  body: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex gap-5 border-t py-6 first:border-t-0 sm:gap-6" style={{ borderColor: LOGISTICS.colors.line }}>
      <span
        className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums"
        style={{ fontFamily: "var(--font-logistics-mono)", color: LOGISTICS.colors.blue }}
      >
        {typeof index === "number" ? String(index).padStart(2, "0") : index}
      </span>
      <div>
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-logistics-display)", color: LOGISTICS.colors.ink }}>
            {title}
          </h3>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
      </div>
    </div>
  );
}

/** Section heading used throughout — mono eyebrow + condensed display title. */
export function SectionHeading({
  eyebrow,
  title,
  body,
  dark = false,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  dark?: boolean;
  align?: "left" | "center";
}) {
  return (
    <FadeIn className={align === "center" ? "text-center" : ""}>
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <h2
        className="mt-3 text-4xl font-extrabold uppercase leading-[0.98] tracking-tight sm:text-5xl"
        style={{ fontFamily: "var(--font-logistics-display)", color: dark ? "#fff" : LOGISTICS.colors.ink }}
      >
        {title}
      </h2>
      {body && (
        <p className={`mt-4 max-w-xl text-base ${align === "center" ? "mx-auto" : ""}`} style={{ color: dark ? "rgba(255,255,255,0.65)" : "#475569" }}>
          {body}
        </p>
      )}
    </FadeIn>
  );
}

export function ArrowLink({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className="group mt-4 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide"
      style={{ color: dark ? LOGISTICS.colors.white : LOGISTICS.colors.blue }}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/** A UK-style number plate (yellow, with the blue country strip) — used for
 *  licence categories so "C+E / C / C1" read instantly to anyone in haulage. */
export function Plate({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-stretch overflow-hidden rounded-[4px] border-2 border-black/80 text-sm font-bold shadow-[0_2px_0_rgba(0,0,0,0.35)]"
      style={{ fontFamily: "var(--font-logistics-mono)", background: "#f5c518", color: "#111" }}
    >
      <span className="flex items-center bg-[#1d4ed8] px-1.5 text-[9px] font-bold leading-none text-white">UK</span>
      <span className="px-2.5 py-1 tracking-wider">{children}</span>
    </span>
  );
}

/** A motorway/A-road gantry sign: green panel, white inset border, rounded corners.
 *  The page's closing call to action sits on one. */
export function RoadSign({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative mx-auto rounded-[14px] p-2 shadow-[0_26px_50px_-20px_rgba(0,0,0,0.7)] ${className}`}
      style={{ background: "#0e5a2b" }}
    >
      <div className="rounded-[9px] border-[3px] border-white px-6 py-12 text-center text-white sm:px-14">{children}</div>
      {/* gantry posts */}
      <span aria-hidden="true" className="absolute -bottom-9 left-[14%] hidden h-9 w-3 bg-gradient-to-b from-white/25 to-transparent sm:block" />
      <span aria-hidden="true" className="absolute -bottom-9 right-[14%] hidden h-9 w-3 bg-gradient-to-b from-white/25 to-transparent sm:block" />
    </div>
  );
}

const STEP_COLS = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as const;

/** A process shown as numbered stops joined by a dashed road: vertical on
 *  phones/tablets, horizontal from `lg` up. Shared by every page with steps. */
export function RouteSteps({ steps, columns }: { steps: { title: string; body: string }[]; columns: 3 | 4 }) {
  const dash = (dir: "180deg" | "90deg") => ({
    background: `repeating-linear-gradient(${dir}, ${LOGISTICS.colors.blue} 0 8px, transparent 8px 16px)`,
  });
  return (
    <div className={`mt-16 grid gap-12 lg:gap-10 ${STEP_COLS[columns]}`}>
      {steps.map((s, i) => (
        <FadeIn key={s.title} delay={i * 0.1}>
          <div className="relative pl-16 lg:pl-0 lg:pt-16">
            <span
              className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border-[3px] text-sm font-bold"
              style={{ background: LOGISTICS.colors.ink, borderColor: LOGISTICS.colors.blue, color: "#fff", fontFamily: "var(--font-logistics-mono)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {i < steps.length - 1 && (
              <>
                <span aria-hidden="true" className="absolute left-[21px] top-11 h-[calc(100%+0.25rem)] w-[3px] lg:hidden" style={dash("180deg")} />
                <span aria-hidden="true" className="absolute left-14 top-[20px] hidden h-[3px] w-[calc(100%-2rem)] lg:block" style={dash("90deg")} />
              </>
            )}
            <h3 className="text-xl font-bold uppercase" style={{ fontFamily: "var(--font-logistics-display)", color: LOGISTICS.colors.ink }}>{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.body}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}
