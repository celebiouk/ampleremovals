"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Rating {
  bookingId: string;
  reference: string;
  rating: number;
  feedback: string | null;
  customerName: string;
}
interface RatingsResult {
  average: number | null;
  count: number;
  ratings: Rating[];
}

/** Driver portal widget: average rating + recent customer comments. */
export function DriverRatingsWidget() {
  const [data, setData] = useState<RatingsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/drivers/ratings")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data || data.count === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">My Ratings</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold text-slate-900">{data.average?.toFixed(1)}</span>
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-sm text-slate-500">({data.count})</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.ratings.slice(0, 5).map((r) => (
          <div key={r.bookingId} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                ))}
              </div>
              <span className="font-mono text-xs text-slate-400">{r.reference}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">{r.customerName}</p>
            {r.feedback && <p className="mt-1 text-sm italic text-slate-700">“{r.feedback}”</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
