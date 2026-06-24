/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Search, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  driverId: string; score: number; available: boolean;
  jobsThatDay: number; distanceMiles: number | null; reasons: string[];
}

interface AssignDriverModalProps {
  bookingId: string;
  bookingReference: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignDriverModal({
  bookingId,
  bookingReference,
  isOpen,
  onClose,
  onSuccess,
}: AssignDriverModalProps) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [payPercentageOverride, setPayPercentageOverride] = useState("");
  const [isLeadDriver, setIsLeadDriver] = useState(false);
  const [role, setRole] = useState<"driver" | "porter">("driver");
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [topId, setTopId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadDrivers();
      loadSuggestions();
    }
  }, [isOpen]);

  async function loadDrivers() {
    try {
      const response = await fetch("/api/admin/drivers");
      const data = await response.json();
      if (data.success) {
        setDrivers(data.drivers.filter((d: any) => d.status === "active"));
      }
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSuggestions() {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/suggest-driver`);
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        const map: Record<string, Suggestion> = {};
        data.suggestions.forEach((s: Suggestion) => { map[s.driverId] = s; });
        setSuggestions(map);
        if (data.suggestions[0]) {
          setTopId(data.suggestions[0].driverId);
          setSelectedDriverId((cur) => cur || data.suggestions[0].driverId); // pre-select best
        }
      }
    } catch { /* suggestions are optional */ }
  }

  async function handleAssign() {
    if (!selectedDriverId) {
      toast.error("Please select a driver");
      return;
    }

    setAssigning(true);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriverId,
          payPercentageOverride: payPercentageOverride ? parseFloat(payPercentageOverride) : null,
          isLeadDriver,
          role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Driver assigned successfully");
        // Surface scheduling clashes (non-blocking).
        if (Array.isArray(data.conflicts) && data.conflicts.length > 0) {
          data.conflicts.forEach((c: { message: string }) =>
            toast.warning(c.message, { duration: 8000 }),
          );
        }
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to assign driver");
      }
    } catch (error) {
      console.error("Assign error:", error);
      toast.error("Failed to assign driver");
    } finally {
      setAssigning(false);
    }
  }

  const filteredDrivers = drivers
    .filter((driver) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        driver.first_name?.toLowerCase().includes(search) ||
        driver.last_name?.toLowerCase().includes(search) ||
        driver.email?.toLowerCase().includes(search)
      );
    })
    // Best-suggested drivers first.
    .sort((a, b) => (suggestions[b.id]?.score ?? -1) - (suggestions[a.id]?.score ?? -1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Assign Driver</h2>
            <p className="text-sm text-slate-600">Booking: {bookingReference}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search drivers..."
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
              />
            </div>

            {/* Driver List */}
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {filteredDrivers.length === 0 ? (
                <p className="py-8 text-center text-slate-600">No active drivers found</p>
              ) : (
                filteredDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                      selectedDriverId === driver.id
                        ? "bg-brand-purple-100 ring-2 ring-brand-purple-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple-600 font-semibold text-white">
                      {driver.first_name?.[0]}{driver.last_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{driver.first_name} {driver.last_name}</span>
                        {topId === driver.id && (
                          <span className="flex items-center gap-1 rounded-full bg-brand-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-green-700">
                            <Sparkles className="h-3 w-3" /> Recommended
                          </span>
                        )}
                        {suggestions[driver.id] && !suggestions[driver.id].available && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                            <AlertTriangle className="h-3 w-3" /> Clash
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600">
                        {suggestions[driver.id]
                          ? suggestions[driver.id].reasons.join(" · ")
                          : `Default pay: ${driver.default_pay_percentage}%`}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pay Override */}
            {selectedDriverId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Pay % Override (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={payPercentageOverride}
                  onChange={(e) => setPayPercentageOverride(e.target.value)}
                  placeholder="Leave empty to use default"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-purple-500 focus:outline-none focus:ring-2 focus:ring-brand-purple-500/20"
                />
              </div>
            )}

            {/* Lead driver toggle */}
            {selectedDriverId && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={isLeadDriver}
                  onChange={(e) => setIsLeadDriver(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-purple-600 focus:ring-brand-purple-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Lead driver</div>
                  <div className="text-xs text-slate-500">
                    Mark this driver as the lead on this job
                  </div>
                </div>
              </label>
            )}

            {/* Role: driver or porter */}
            {selectedDriverId && (
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-medium text-slate-900">Role on this job</div>
                <div className="flex gap-2">
                  {(["driver", "porter"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${role === r ? "border-brand-purple-600 bg-brand-purple-50 text-brand-purple-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedDriverId || assigning}
                className="flex items-center gap-2 rounded-xl bg-brand-purple-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-purple-700 disabled:opacity-50"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Driver"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
