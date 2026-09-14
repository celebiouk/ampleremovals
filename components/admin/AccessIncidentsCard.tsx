"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Incident {
  id: string;
  description: string;
  signerName: string;
  driverName: string | null;
  createdAt: string;
  photoUrls: string[];
  signatureUrl: string | null;
}

/**
 * Access/damage-risk incidents a driver reported for this booking — the
 * driver's written account, photos, and the customer's signature for a
 * specific risky situation they agreed to proceed with. See
 * app/api/admin/bookings/[id]/incidents/route.ts. Renders nothing when there
 * are none, so it never adds empty clutter to the booking page.
 */
export function AccessIncidentsCard({ bookingId }: { bookingId: string }) {
  const [incidents, setIncidents] = useState<Incident[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/incidents`);
      const data = await res.json();
      if (data.success) setIncidents(data.incidents as Incident[]);
    } catch { /* leave as-is */ }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  if (!incidents || incidents.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-slate-900">Access/damage risk reports</h3>
      </div>
      <div className="space-y-4">
        {incidents.map((inc) => (
          <div key={inc.id} className="rounded-xl border border-amber-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{formatDateTime(inc.createdAt)}{inc.driverName ? ` · Reported by ${inc.driverName}` : ""}</span>
            </div>
            <p className="mt-2 min-w-0 break-words text-sm text-slate-800">{inc.description}</p>

            {inc.photoUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {inc.photoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Incident photo" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
              <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">Signed by {inc.signerName}</span>
            </div>
            {inc.signatureUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={inc.signatureUrl} alt="Signature" className="mt-2 h-16 max-w-full object-contain" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
