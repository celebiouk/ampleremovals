"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = ["Enter your postcode", "e.g. RG20 7UB"];

export function PostcodeSearch({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const router = useRouter();
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
        setFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = postcode.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/booking/removals?postcode=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className={cn("w-full max-w-md", className)}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex w-full flex-col gap-2.5 rounded-2xl p-2.5 sm:flex-row sm:items-center",
          variant === "dark"
            ? "bg-white/10 ring-1 ring-white/15 backdrop-blur"
            : error
            ? "bg-white ring-[3px] ring-red-500 shadow-[0_0_0_6px_rgba(239,68,68,0.12)] shadow-2xl"
            : "bg-white ring-[3px] ring-brand-purple-600 shadow-[0_0_0_6px_rgba(107,33,168,0.12)] shadow-2xl"
        )}
      >
        <div className="relative flex flex-1 items-center gap-2.5 px-3">
          <MapPin
            className={cn(
              "h-5 w-5 shrink-0",
              variant === "dark" ? "text-brand-green-400" : error ? "text-red-500" : "text-brand-purple-500"
            )}
          />
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="text"
              autoComplete="postal-code"
              value={postcode}
              onChange={(e) => { setPostcode(e.target.value.toUpperCase()); setError(false); }}
              aria-label="Your postcode"
              className={cn(
                "peer h-12 w-full bg-transparent text-[1.05rem] font-semibold outline-none sm:h-11",
                variant === "dark" ? "text-white" : "text-slate-900"
              )}
            />
            {postcode === "" && (
              <span
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 flex items-center text-[1.05rem] transition-opacity duration-300",
                  fade ? "opacity-100" : "opacity-0",
                  variant === "dark" ? "text-white/50" : "text-slate-400"
                )}
              >
                {PLACEHOLDERS[placeholderIndex]}
              </span>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-green-600 px-7 text-base font-bold text-white shadow-lg shadow-brand-green-600/30 transition-all duration-200 hover:bg-brand-green-500 active:scale-[0.98] sm:h-11"
        >
          Get a quote
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <MapPin className="h-4 w-4 shrink-0" />
          Please enter your postcode first
        </p>
      )}
    </div>
  );
}

export default PostcodeSearch;
