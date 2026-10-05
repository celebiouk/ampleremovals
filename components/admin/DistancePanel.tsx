"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Navigation, Loader2 } from "lucide-react";

interface Leg {
  miles: number;
  minutes: number;
}

interface Distances {
  officePostcode: string;
  officeToOrigin: Leg | null;
  originToDestination: Leg | null;
  destinationToOffice: Leg | null;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Shows the three job legs the team cares about, fetched from
 * /api/postcode/distances (which reads the office postcode from Settings):
 *   • our office → first pickup
 *   • pickup → dropoff
 *   • dropoff → back to our office
 * Each leg shows both driving distance (miles) and typical duration.
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
        setData({
          officePostcode: d.officePostcode,
          officeToOrigin: d.officeToOrigin,
          originToDestination: d.originToDestination,
          destinationToOffice: d.destinationToOffice,
        });
      })
      .catch(() => { /* leave panel showing "—" */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [origin, destination]);

  // Nothing to measure from yet.
  if (!origin) return null;

  const legValue = (l: Leg | null) =>
    loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin text-slate-400" />
      : l == null ? <span className="text-slate-400">—</span>
      : <span className="font-bold text-slate-900">{l.miles} mi <span className="font-normal text-slate-500">· {formatMinutes(l.minutes)}</span></span>;

  return (
    <div className={`rounded-xl border border-blue-200 bg-blue-50/60 p-3 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Navigation className="h-3.5 w-3.5 text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Distances & Drive Times</p>
      </div>
      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-600">
            <Building2 className="h-4 w-4 shrink-0 text-blue-500" />
            Office{data?.officePostcode ? ` (${data.officePostcode})` : ""} → pickup
          </span>
          <span className="shrink-0">{legValue(data?.officeToOrigin ?? null)}</span>
        </div>
        {destination && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
              Pickup → dropoff
            </span>
            <span className="shrink-0">{legValue(data?.originToDestination ?? null)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-600">
            <Building2 className="h-4 w-4 shrink-0 text-blue-500" />
            {destination ? "Dropoff" : "Pickup"} → back to office
          </span>
          <span className="shrink-0">{legValue(data?.destinationToOffice ?? null)}</span>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">Driving distance & typical drive time (via road).</p>
    </div>
  );
}
