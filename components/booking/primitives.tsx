"use client";

import { Check, AlertCircle, Plus, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Step heading ─────────────────────────────────────────── */
export function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-purple-950 sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 text-slate-500">{subtitle}</p>}
    </div>
  );
}

/* ── Inline field error ───────────────────────────────────── */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

/* ── Large selectable card (radio-like) ───────────────────── */
export function SelectableCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-start gap-4 rounded-xl border-2 bg-white p-5 text-left transition-all duration-150",
        "hover:scale-[1.02] hover:border-brand-purple-300 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-600 focus-visible:ring-offset-2",
        selected
          ? "border-brand-purple-600 bg-brand-purple-50 shadow-md"
          : "border-slate-200",
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
            selected
              ? "bg-brand-purple-800 text-white"
              : "bg-brand-purple-50 text-brand-purple-800 group-hover:bg-brand-purple-100"
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
      )}
      <span className="flex-1">
        <span className="block font-display text-base font-bold text-brand-purple-950">
          {title}
        </span>
        {description && (
          <span className="mt-1 block text-sm leading-relaxed text-slate-500">
            {description}
          </span>
        )}
      </span>

      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected
            ? "border-brand-green-600 bg-brand-green-600 text-white"
            : "border-slate-300 bg-transparent text-transparent"
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    </button>
  );
}

/* ── Toggle card (checkbox-like, multi-select) ────────────── */
export function ToggleCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "relative flex h-full w-full flex-col gap-3 rounded-xl border-2 bg-white p-5 text-left transition-all duration-150",
        "hover:border-brand-purple-300 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-600 focus-visible:ring-offset-2",
        selected
          ? "border-brand-purple-600 bg-brand-purple-50 shadow-md"
          : "border-slate-200"
      )}
    >
      <span className="flex items-center justify-between">
        {Icon && (
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              selected
                ? "bg-brand-purple-800 text-white"
                : "bg-brand-purple-50 text-brand-purple-800"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
            selected
              ? "border-brand-green-600 bg-brand-green-600 text-white"
              : "border-slate-300 text-transparent"
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      </span>
      <span>
        <span className="block font-display text-base font-bold text-brand-purple-950">
          {title}
        </span>
        {description && (
          <span className="mt-1 block text-sm leading-relaxed text-slate-500">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}

/* ── Quantity stepper ─────────────────────────────────────── */
/**
 * Compact −/+ counter. At 0 it collapses to a single "add" button so long item
 * lists stay calm and scannable; once selected it expands to − n +.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  if (value <= 0) {
    return (
      <button
        type="button"
        onClick={inc}
        aria-label="Add"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 text-brand-purple-700 transition-colors hover:border-brand-purple-400 hover:bg-brand-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-600 focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={dec}
        aria-label="Decrease"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 text-slate-600 transition-colors hover:border-brand-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-600 focus-visible:ring-offset-2"
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className="w-8 text-center font-display text-base font-bold tabular-nums text-brand-purple-950">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        aria-label="Increase"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-purple-600 bg-brand-purple-800 text-white transition-colors hover:bg-brand-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-600 focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ── Pill / chip selector ─────────────────────────────────── */
export function OptionChip({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-600 focus-visible:ring-offset-2",
        selected
          ? "border-brand-purple-600 bg-brand-purple-800 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-brand-purple-300"
      )}
    >
      {label}
    </button>
  );
}
