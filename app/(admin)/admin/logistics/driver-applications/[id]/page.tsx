"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, FileDown } from "lucide-react";
import { toast } from "sonner";
import { DRIVER_APPLICATION_STATUSES, statusLabel } from "@/lib/logistics";

interface ApplicationDetail {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  town_city: string;
  postcode: string;
  licence_category: string;
  experience_years: string | null;
  driver_cpc_status: string | null;
  tacho_card_status: string | null;
  preferred_work_type: string | null;
  preferred_pattern: string | null;
  availability: string | null;
  preferred_locations: string | null;
  experience_notes: string | null;
  additional_info: string | null;
  cv_path: string | null;
  status: string;
  admin_notes: string | null;
  notified_at: string | null;
  created_at: string;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export default function DriverApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/logistics/driver-applications/${params.id}`);
    const json = await res.json();
    if (json.success) {
      setData(json.application);
      setCvUrl(json.cvSignedUrl);
      setStatus(json.application.status);
      setNotes(json.application.admin_notes ?? "");
    } else {
      toast.error(json.error ?? "Couldn't load this application.");
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/logistics/driver-applications/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Saved");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <div className="flex items-center gap-2 p-6 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <button onClick={() => router.push("/admin/logistics/driver-applications")} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Driver Applications
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">{data.full_name}</h1>
            <p className="text-sm text-slate-400">Ref: {data.reference} · Submitted {new Date(data.created_at).toLocaleString("en-GB")}</p>
          </div>
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              <FileDown className="h-4 w-4" /> Download CV
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="Email" value={data.email} />
          <Field label="Phone" value={data.phone} />
          <Field label="Town / City" value={data.town_city} />
          <Field label="Postcode" value={data.postcode} />
          <Field label="Licence Category" value={data.licence_category} />
          <Field label="Experience" value={data.experience_years} />
          <Field label="Driver CPC" value={data.driver_cpc_status} />
          <Field label="Tachograph Card" value={data.tacho_card_status} />
          <Field label="Preferred Work Type" value={data.preferred_work_type} />
          <Field label="Preferred Shifts" value={data.preferred_pattern} />
          <Field label="Availability" value={data.availability} />
          <Field label="Preferred Locations" value={data.preferred_locations} />
          <Field label="CV" value={data.cv_path ? "Attached" : "Not provided"} />
          <Field label="Notification Sent" value={data.notified_at ? new Date(data.notified_at).toLocaleString("en-GB") : "Not yet"} />
        </div>

        {data.experience_notes && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase text-slate-400">Relevant Experience</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{data.experience_notes}</p>
          </div>
        )}
        {data.additional_info && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase text-slate-400">Additional Information</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{data.additional_info}</p>
          </div>
        )}

        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {DRIVER_APPLICATION_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase text-slate-400">Internal Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Notes visible only to admin staff…" />
        </div>

        <button onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
