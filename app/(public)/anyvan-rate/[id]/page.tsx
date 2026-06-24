"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle } from "lucide-react";
import { DEFAULT_GOOGLE_REVIEW_LINK } from "@/lib/constants";

/**
 * Public AnyVan rating page. The customer taps a star → it's recorded against the
 * AnyVan job. 5★ → invited to a Google review; 1–4★ → private thank-you (internal).
 */
export default function AnyVanRatePage() {
  const { id } = useParams<{ id: string }>();
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function rate(n: number) {
    if (busy || submitted != null) return;
    setBusy(true);
    try {
      await fetch("/api/anyvan/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rating: n }),
      });
    } catch {
      /* still thank them */
    } finally {
      setSubmitted(n);
      setBusy(false);
    }
  }

  if (submitted != null) {
    if (submitted === 5) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
              <Star className="h-10 w-10 fill-yellow-500 text-yellow-500" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-slate-900">Thank you! 🎉</h1>
            <p className="mt-4 text-lg text-slate-600">
              We're so glad our driver looked after you. Would you share that on Google? It
              really helps other people find Ample Removals.
            </p>
            <a
              href={DEFAULT_GOOGLE_REVIEW_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-8 py-4 font-semibold text-white hover:bg-green-700"
            >
              <Star className="h-5 w-5 fill-white" /> Leave a Google review
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Thank you!</h1>
          <p className="mt-4 text-lg text-slate-600">
            We appreciate your feedback — it goes straight to our team so we can keep improving.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">How did our driver do?</h1>
        <p className="mt-3 text-slate-600">
          Your items were delivered by an Ample Removals driver on behalf of AnyVan. Tap a star
          to let us know.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={busy}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => rate(n)}
              className="p-1 transition-transform active:scale-90 disabled:opacity-50"
            >
              <Star className={`h-12 w-12 ${n <= hover ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
