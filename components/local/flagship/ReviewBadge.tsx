import { Star } from "lucide-react";
import type { AggregateRatingStats } from "@/lib/reviews-stats";

/**
 * Visible trust badge showing the real, first-party aggregate rating
 * (lib/reviews-stats.ts — computed from genuine post-move survey data,
 * never fabricated) and linking out to the actual Google review page so
 * visitors can read verified reviews themselves. Renders nothing if there
 * isn't yet enough review volume to show honestly.
 */
export function ReviewBadge({
  stats,
  googleReviewLink,
  className = "",
}: {
  stats: AggregateRatingStats | null;
  googleReviewLink: string;
  className?: string;
}) {
  if (!stats) return null;

  return (
    <a
      href={googleReviewLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 ${className}`}
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </span>
      Rated {stats.ratingValue.toFixed(1)} from {stats.reviewCount}+ verified reviews
    </a>
  );
}
