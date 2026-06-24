"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star } from "lucide-react";

/**
 * Rating landing — the link customers get by SMS/WhatsApp (which can't render the
 * email's clickable star buttons). They tap a star, which routes to the existing
 * /survey/[bookingId]/[rating] flow (5★ → Google review, 1–4★ → internal feedback).
 */
export default function SurveyLandingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [hover, setHover] = useState(0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">How was your move with Ample Removals?</h1>
        <p className="mt-3 text-slate-600">Tap a star to rate us — it only takes a second.</p>
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => router.push(`/survey/${bookingId}/${n}`)}
              className="p-1 transition-transform active:scale-90"
            >
              <Star
                className={`h-12 w-12 ${n <= hover ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
              />
            </button>
          ))}
        </div>
        <p className="mt-8 text-xs text-slate-400">Your feedback helps us improve and helps other families find us.</p>
      </div>
    </div>
  );
}
