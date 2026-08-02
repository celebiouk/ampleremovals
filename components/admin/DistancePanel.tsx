"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Navigation, Loader2 } from "lucide-react";

interface Distances {
  officePostcode: string;
  officeToOrigin: number | null;
  originToDestination: number | null;
}

/**
 * Shows the two job distances (in miles) the team cares about, fetched from
 * /api/postcode/distances (which reads the office postcode from Settings):
 *   • our office → first pickup
 *   • pickup → dropoff
 * Renders nothing until there's a pickup postcode to measure from.
 */
export function DistancePanel({
  originPostcode,
  destinationPostcode,
  className = "",
}: {
  originPostcode?: string | null;
  destinationPostcode?: string | null;
  className?: string;
}) {
  const [data, setData] = useState<Distances | null>(null);
  const [loading, setLoading] = useState(false);

  const origin = (originPostcode ?? "").trim();
  const destination = (destinationPostcode ?? "").trim();

  useEffect(() => {
    if (!origin) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    fetch("/api/postcode/distances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination: destination || undefined }),
    })
      .then((r) => r.json())
      .then((d: { success?: boolean } & Distances) => {
        if (cancelled || !d.success) return;
        setData({ officePostcode: d.officePostcode, officeToOrigin: d.officeToOrigin, originToDestination: d.originToDestination });
      })
      .catch(() => { /* leave panel showing "—" */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [origin, destination]);

  // Nothing to measure from yet.
  if (!origin) return null;

  const miles = (n: number | null) =>
    loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin text-slate-400" />
      : n == null ? <span className="text-slate-400">—</span>
      : <span className="font-bold text-slate-900">{n} mi</span>;

  return (
    <div className={`rounded-xl border border-blue-200 bg-blue-50/60 p-3 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Navigation className="h-3.5 w-3.5 text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Distances</p>
      </div>
      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Building2 className="h-4 w-4 text-blue-500" />
            Office{data?.officePostcode ? ` (${data.officePostcode})` : ""} → pickup
          </span>
          {miles(data?.officeToOrigin ?? null)}
        </div>
        {destination && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="h-4 w-4 text-blue-500" />
              Pickup → dropoff
            </span>
            {miles(data?.originToDestination ?? null)}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">Driving distance (via road).</p>
    </div>
  );
}
