import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_GOOGLE_REVIEW_LINK } from "@/lib/constants";

export interface AggregateRatingStats {
  ratingValue: number;
  reviewCount: number;
}

/**
 * Real, first-party rating stats computed from `bookings.survey_rating` —
 * the genuine 1-5 star ratings customers submit via the post-move survey
 * flow (lib/rating-request.ts, app/(public)/survey/**). Never fabricated.
 *
 * Returns null below MIN_REVIEWS so a brand-new or low-volume period never
 * shows a misleadingly thin/high "5.0 from 2 reviews" — Google's structured
 * data guidelines require ratings to reflect genuine, sufficient review
 * volume, and a tiny sample is also just bad evidence either way.
 *
 * Revalidated hourly via the page's `export const revalidate` rather than
 * refetched on every request — this is aggregate, non-sensitive data (two
 * numbers), safe to compute with the service-role client server-side only.
 */
const MIN_REVIEWS = 5;

export async function getAggregateRatingStats(): Promise<AggregateRatingStats | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("survey_rating")
      .not("survey_rating", "is", null);

    if (error || !data || data.length < MIN_REVIEWS) return null;

    const ratings = data.map((r) => r.survey_rating as number).filter((n) => n >= 1 && n <= 5);
    if (ratings.length < MIN_REVIEWS) return null;

    const sum = ratings.reduce((acc, n) => acc + n, 0);
    const ratingValue = Math.round((sum / ratings.length) * 10) / 10;

    return { ratingValue, reviewCount: ratings.length };
  } catch {
    // Service-role env vars missing locally, or Supabase unreachable at
    // build time — fail quietly, the page just renders without the badge.
    return null;
  }
}

export async function getGoogleReviewLink(): Promise<string> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("settings").select("google_review_link").eq("id", 1).maybeSingle();
    return data?.google_review_link || DEFAULT_GOOGLE_REVIEW_LINK;
  } catch {
    return DEFAULT_GOOGLE_REVIEW_LINK;
  }
}
