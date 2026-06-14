"use client";

/**
 * Public live-tracking page — ampleremovals.com/track/[token].
 * The customer opens the link from their notification and watches the driver
 * approach in real time. No login. Polls /api/track/[token] every 15s.
 * Map uses Google's keyless embed (no API key exposed client-side).
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type TrackData = {
  success: boolean;
  reference: string;
  status: string;
  leg: "pickup" | "delivery" | null;
  arrived: boolean;
  completed: boolean;
  eta: string | null;
  driverName: string;
  destination: { line_1: string; city: string; postcode: string; lat: number; lng: number } | null;
  location: { lat: number; lng: number; heading: number | null; recorded_at: string } | null;
  error?: string;
};

function etaLabel(eta: string | null): string {
  if (!eta) return "Calculating…";
  const mins = Math.round((new Date(eta).getTime() - Date.now()) / 60000);
  if (mins <= 1) return "Arriving now";
  return `${mins} min away`;
}

export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${token}`, { cache: "no-store" });
      const json = (await res.json()) as TrackData;
      if (!json.success) { setError(json.error || "Tracking unavailable"); return; }
      setError(null);
      setData(json);
    } catch {
      setError("Connection lost — retrying…");
    }
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const center = data?.location || data?.destination || null;
  const mapSrc = center
    ? `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=14&output=embed`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6b21a8] to-[#4c1480] text-white">
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/15 grid place-items-center font-bold">A</div>
          <span className="font-semibold tracking-tight">Ample Removals</span>
        </div>

        {error && !data && (
          <div className="mt-10 rounded-2xl bg-white/10 p-6 text-center text-white/80">{error}</div>
        )}

        {data && (
          <>
            <div className="mt-8">
              <p className="text-sm uppercase tracking-widest text-white/60">
                {data.completed ? "Job complete" : data.leg === "delivery" ? "On the way to delivery" : "On the way to you"}
              </p>
              <h1 className="mt-1 text-4xl font-bold">
                {data.completed ? "All done 🎉" : data.arrived ? `${data.driverName} has arrived` : etaLabel(data.eta)}
              </h1>
              {!data.completed && !data.arrived && (
                <p className="mt-2 text-white/70">{data.driverName} is driving to your {data.leg === "delivery" ? "delivery address" : "address"}.</p>
              )}
              <p className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium">Ref {data.reference}</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl">
              {mapSrc ? (
                <iframe
                  key={mapSrc}
                  title="Driver location"
                  src={mapSrc}
                  className="h-[360px] w-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-[360px] place-items-center text-white/60">Waiting for driver location…</div>
              )}
            </div>

            {data.destination && (
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-widest text-white/50">Destination</p>
                <p className="mt-1 font-medium">{data.destination.line_1}, {data.destination.city}</p>
                <p className="text-white/70">{data.destination.postcode}</p>
              </div>
            )}

            {data.location && (
              <p className="mt-4 text-center text-xs text-white/40">
                Updated {new Date(data.location.recorded_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </>
        )}

        {!data && !error && (
          <div className="mt-10 animate-pulse space-y-4">
            <div className="h-10 w-2/3 rounded-lg bg-white/10" />
            <div className="h-[360px] rounded-3xl bg-white/10" />
          </div>
        )}
      </div>
    </div>
  );
}
