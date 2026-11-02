"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DRIVER_REQUEST_STATUSES, statusLabel } from "@/lib/logistics";

interface RequestDetail {
  id: string;
  reference: string;
  company_name: string;
  contact_person: string;
  business_email: string;
  phone: string;
  location_postcode: string;
  business_type: string | null;
  licence_category: string;
  drivers_required: number;
  start_date: string | null;
  assignment_duration: string | null;
  shift_type: string | null;
  working_hours: string | null;
  vehicle_type: string | null;
  job_location: string;
  urgency: string;
  additional_info: string | null;
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

export default function DriverRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<RequestDetail | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/logistics/driver-requests/${params.id}`);
    const json = await res.json();
    if (json.success) {
      setData(json.request);
      setStatus(json.request.status);
      setNotes(json.request.admin_notes ?? "");
    } else {
      toast.error(json.error ?? "Couldn't load this request.");
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/logistics/driver-requests/${params.id}`, {
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
      <button onClick={() => router.push("/admin/logistics/driver-requests")} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Business Requests
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">{data.company_name}</h1>
            <p className="text-sm text-slate-400">Ref: {data.reference} · Submitted {new Date(data.created_at).toLocaleString("en-GB")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="Contact Person" value={data.contact_person} />
          <Field label="Business Email" value={data.business_email} />
          <Field label="Phone" value={data.phone} />
          <Field label="Location / Postcode" value={data.location_postcode} />
          <Field label="Business Type" value={data.business_type} />
          <Field label="Licence Category" value={data.licence_category} />
          <Field label="Drivers Required" value={data.drivers_required} />
          <Field label="Start Date" value={data.start_date} />
          <Field label="Assignment Duration" value={data.assignment_duration} />
          <Field label="Shift Type" value={data.shift_type} />
          <Field label="Working Hours" value={data.working_hours} />
          <Field label="Vehicle Type" value={data.vehicle_type} />
          <Field label="Job Location" value={data.job_location} />
          <Field label="Urgency" value={statusLabel(data.urgency)} />
          <Field label="Notification Sent" value={data.notified_at ? new Date(data.notified_at).toLocaleString("en-GB") : "Not yet"} />
        </div>

        {data.additional_info && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase text-slate-400">Additional Requirements</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{data.additional_info}</p>
          </div>
        )}

        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {DRIVER_REQUEST_STATUSES.map((s) => (<option key={s} value={s}>{statusLabel(s)}</option>))}
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
