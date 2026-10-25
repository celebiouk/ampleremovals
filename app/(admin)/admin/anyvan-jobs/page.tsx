"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Package, CheckCircle2, AlertTriangle, Star } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const ANYVAN_PLACEHOLDER_CUSTOMER_ID = "00000000-0000-0000-0000-000000000001";

interface AnyvanBooking {
  id: string;
  reference: string;
  move_date: string | null;
  move_time: string | null;
  status: string;
  customer_id: string | null;
  survey_rating: number | null;
  origin_address: { postcode: string } | { postcode: string }[] | null;
  destination_address: { postcode: string } | { postcode: string }[] | null;
  driver_assignments: {
    role: string | null;
    driver: { first_name: string; last_name: string; preferred_name: string | null } | { first_name: string; last_name: string; preferred_name: string | null }[] | null;
  }[];
}

/**
 * AnyVan jobs — work handled through AnyVan that never touches this system as
 * a full booking, but still a real `bookings` row (is_anyvan: true) so the
 * existing driver/porter assignment, flat pay, and post-completion rating
 * pipeline all work unchanged — nothing special-built for AnyVan specifically.
 * To fill in the customer's real contact details (needed for the rating
 * request to reach an actual person), open the job and use the same customer
 * editor every other booking has.
 */
export default function AnyvanJobsPage() {
  const [jobs, setJobs] = useState<AnyvanBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [originLine1, setOriginLine1] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originPostcode, setOriginPostcode] = useState("");
  const [destLine1, setDestLine1] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destPostcode, setDestPostcode] = useState("");
  const [creating, setCreating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("id, reference, move_date, move_time, status, customer_id, survey_rating, origin_address:addresses!origin_address_id(postcode), destination_address:addresses!destination_address_id(postcode), driver_assignments:booking_driver_assignments(role, driver:drivers(first_name, last_name, preferred_name))")
        .eq("is_anyvan", true)
        .order("move_date", { ascending: false })
        .limit(100);
      setJobs((data ?? []) as unknown as AnyvanBooking[]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function markComplete(job: AnyvanBooking) {
    const hasRealCustomer = job.customer_id && job.customer_id !== ANYVAN_PLACEHOLDER_CUSTOMER_ID;
    if (!hasRealCustomer) {
      const proceed = confirm("No real customer contact is attached to this job — the rating request won't reach anyone. Mark it complete anyway? (You can still add their details afterwards and it'll go out on the next reminder.)");
      if (!proceed) return;
    }
    setCompletingId(job.id);
    try {
      const res = await fetch(`/api/admin/anyvan-jobs/${job.id}/complete`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`${job.reference} marked complete — rating request sent`);
        load();
      } else {
        toast.error(data.error || "Failed to mark complete");
      }
    } catch {
      toast.error("Failed to mark complete");
    } finally {
      setCompletingId(null);
    }
  }

  function resetForm() {
    setDate(""); setTime(""); setShowForm(false); setShowDetails(false);
    setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
    setOriginLine1(""); setOriginCity(""); setOriginPostcode("");
    setDestLine1(""); setDestCity(""); setDestPostcode("");
  }

  async function create() {
    if (!date) { toast.error("Pick a date"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/anyvan-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, time: time || null,
          ...(customerName.trim() || customerPhone.trim() ? {
            customerName: customerName.trim(), customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim() || undefined,
          } : {}),
          ...(originPostcode.trim() ? {
            originAddress: { line_1: originLine1.trim(), city: originCity.trim() || undefined, postcode: originPostcode.trim() },
          } : {}),
          ...(destPostcode.trim() ? {
            destinationAddress: { line_1: destLine1.trim(), city: destCity.trim() || undefined, postcode: destPostcode.trim() },
          } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`AnyVan job ${data.booking.reference} created`);
        resetForm();
        load();
      } else toast.error(data.error || "Failed to create job");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Package className="h-6 w-6 text-brand-purple-700" /> AnyVan Jobs</h1>
          <p className="text-sm text-slate-500">Work handled through AnyVan — no invoice, just a date/time, who's assigned, and optionally a customer &amp; address.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 rounded-xl bg-brand-purple-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-900">
          <Plus className="h-4 w-4" /> New AnyVan Job
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
            <button onClick={create} disabled={creating} className="flex items-center justify-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create job"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="mt-3 text-xs font-semibold text-brand-purple-700 hover:text-brand-purple-900"
          >
            {showDetails ? "− Hide customer & address details" : "+ Add customer & address details (optional)"}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-4 border-t border-slate-100 pt-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Customer (for the rating request)</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pickup address</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input value={originLine1} onChange={(e) => setOriginLine1(e.target.value)} placeholder="Address line 1" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  <input value={originCity} onChange={(e) => setOriginCity(e.target.value)} placeholder="City (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  <input value={originPostcode} onChange={(e) => setOriginPostcode(e.target.value)} placeholder="Postcode" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Dropoff address</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input value={destLine1} onChange={(e) => setDestLine1(e.target.value)} placeholder="Address line 1" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  <input value={destCity} onChange={(e) => setDestCity(e.target.value)} placeholder="City (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  <input value={destPostcode} onChange={(e) => setDestPostcode(e.target.value)} placeholder="Postcode" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">After creating, open the job to assign a driver and porter — each gets a flat amount you set (defaults: £150 driver / £100 porter per day).</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" /></div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No AnyVan jobs yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Crew</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => {
                const hasRealCustomer = j.customer_id && j.customer_id !== ANYVAN_PLACEHOLDER_CUSTOMER_ID;
                const crewNames = j.driver_assignments.map((a) => {
                  const d = Array.isArray(a.driver) ? a.driver[0] : a.driver;
                  if (!d) return null;
                  const name = d.preferred_name || d.first_name;
                  return a.role === "porter" ? `${name} (porter)` : name;
                }).filter(Boolean);
                const origin = Array.isArray(j.origin_address) ? j.origin_address[0] : j.origin_address;
                const dest = Array.isArray(j.destination_address) ? j.destination_address[0] : j.destination_address;
                const route = origin?.postcode ? (dest?.postcode ? `${origin.postcode} → ${dest.postcode}` : origin.postcode) : "—";
                return (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${j.id}`} className="font-medium text-brand-purple-700 hover:underline">{j.reference}</Link>
                      {!hasRealCustomer && (
                        <span title="No real customer contact attached — open the job to add it" className="ml-1.5 inline-flex align-middle">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{j.move_date ?? "—"}</td>
                    <td className="px-4 py-3">{j.move_time ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{route}</td>
                    <td className="px-4 py-3 text-slate-600">{crewNames.length > 0 ? crewNames.join(", ") : <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{j.status === "job_completed" ? "Completed" : j.status}</td>
                    <td className="px-4 py-3">
                      {j.survey_rating != null ? (
                        <span className="flex items-center gap-1 text-slate-700"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {j.survey_rating}/5</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {j.status !== "job_completed" && (
                        <button
                          onClick={() => markComplete(j)}
                          disabled={completingId === j.id}
                          className="flex items-center gap-1.5 rounded-lg border border-brand-green-200 bg-brand-green-50 px-3 py-1.5 text-xs font-semibold text-brand-green-700 hover:bg-brand-green-100 disabled:opacity-50"
                        >
                          {completingId === j.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Mark complete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
