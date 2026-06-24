"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_GOOGLE_REVIEW_LINK } from "@/lib/constants";

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const rating = parseInt(params.rating as string);

  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-submit if no feedback box (5-star rating)
  useEffect(() => {
    if (rating === 5) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          feedback: feedback.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        toast.success("Thank you for your feedback!");
      } else {
        toast.error(data.error || "Failed to submit feedback");
      }
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingInfo = () => {
    switch (rating) {
      case 5:
        return { emoji: "⭐⭐⭐⭐⭐", label: "Excellent!", color: "from-green-500 to-green-600", askFeedback: false };
      case 4:
        return { emoji: "⭐⭐⭐⭐", label: "Good!", color: "from-lime-500 to-lime-600", askFeedback: true };
      case 3:
        return { emoji: "⭐⭐⭐", label: "OK", color: "from-amber-500 to-amber-600", askFeedback: true };
      case 2:
        return { emoji: "⭐⭐", label: "Poor", color: "from-orange-500 to-orange-600", askFeedback: true };
      case 1:
        return { emoji: "⭐", label: "Bad", color: "from-red-500 to-red-600", askFeedback: true };
      default:
        return { emoji: "⭐", label: "Unknown", color: "from-slate-500 to-slate-600", askFeedback: true };
    }
  };

  const ratingInfo = getRatingInfo();

  // Submitted state — every customer is thanked and invited to leave a Google
  // review (no star gating); their rating + feedback are already saved for the team.
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Thank you!</h1>
          <p className="mt-4 text-lg text-slate-600">
            We really appreciate you taking the time. If you have a moment, a quick Google
            review helps other families find us.
          </p>
          <a
            href={DEFAULT_GOOGLE_REVIEW_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-8 py-4 font-semibold text-white hover:bg-green-700"
          >
            <Star className="h-5 w-5 fill-white" /> Leave a Google review
          </a>
          <button onClick={() => router.push("/")} className="mt-4 block w-full text-sm text-slate-500 hover:text-slate-700">
            No thanks
          </button>
        </div>
      </div>
    );
  }

  // Auto-submitting (5 stars)
  if (rating === 5 && submitting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-purple-50 to-white p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-purple-600" />
          <p className="mt-4 text-lg text-slate-600">Submitting your feedback...</p>
        </div>
      </div>
    );
  }

  // Survey form (ratings 1-4)
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 to-white p-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Rating Display */}
          <div className={`bg-gradient-to-r ${ratingInfo.color} rounded-xl p-8 text-center text-white`}>
            <p className="text-5xl">{ratingInfo.emoji}</p>
            <p className="mt-4 text-2xl font-bold">{ratingInfo.label}</p>
            <p className="mt-2 text-sm opacity-90">You rated us {rating}/5 stars</p>
          </div>

          {/* Feedback Form */}
          {ratingInfo.askFeedback && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-slate-900">
                {rating >= 4 ? "What did you enjoy most?" : "How can we improve?"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {rating >= 4
                  ? "We'd love to hear what we did well!"
                  : "Your feedback helps us provide better service."}
              </p>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts... (optional)"
                rows={5}
                className="mt-4 w-full resize-none rounded-xl border-2 border-slate-200 p-4 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
              />

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-purple-700 px-6 py-4 font-semibold text-white hover:bg-brand-purple-800 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                You can skip this if you prefer
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
