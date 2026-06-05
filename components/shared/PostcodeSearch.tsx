"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Postcode-first quote entry. On submit it carries the postcode into the
 * removals booking flow (?postcode=...), where the wizard (Phase 2) picks it up.
 */
export function PostcodeSearch({
  className,
  variant = "light",
}: {
  className?: string;
  /** "light" for white sections, "dark" for purple sections. */
  variant?: "light" | "dark";
}) {
  const router = useRouter();
  const [postcode, setPostcode] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = postcode.trim();
    const query = trimmed ? `?postcode=${encodeURIComponent(trimmed)}` : "";
    router.push(`/booking/removals${query}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full max-w-md flex-col gap-2.5 rounded-2xl p-2.5 sm:flex-row sm:items-center",
        variant === "dark"
          ? "bg-white/10 ring-1 ring-white/15 backdrop-blur"
          : "bg-white shadow-xl shadow-brand-purple-900/10 ring-1 ring-brand-purple-100",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-2.5 px-3">
        <MapPin
          className={cn(
            "h-5 w-5 shrink-0",
            variant === "dark" ? "text-brand-green-400" : "text-brand-purple-400"
          )}
        />
        <input
          type="text"
          inputMode="text"
          autoComplete="postal-code"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.toUpperCase())}
          placeholder="Enter your postcode"
          aria-label="Your postcode"
          className={cn(
            "h-12 w-full bg-transparent text-base font-medium outline-none placeholder:font-normal sm:h-11",
            variant === "dark"
              ? "text-white placeholder:text-white/50"
              : "text-slate-900 placeholder:text-slate-400"
          )}
        />
      </div>
      <button
        type="submit"
        className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-green-600 px-7 text-base font-bold text-white shadow-lg shadow-brand-green-600/30 transition-all duration-200 hover:bg-brand-green-500 active:scale-[0.98] sm:h-11"
      >
        Get a quote
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}

export default PostcodeSearch;
