"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Users, Phone, Mail } from "lucide-react";

interface DriverRow {
  id: string;
  first_name: string;
  last_name: string | null;
  preferred_name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  account_type: string;
  job_count: number;
}

/**
 * Porters are driver-app accounts (drivers.account_type = 'porter') so they
 * get real login/push/profile — this page is a filtered view of the same
 * /api/admin/drivers list the Drivers page uses, not a separate table.
 */
export default function PortersPage() {
  const [porters, setPorters] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/drivers");
        const data = await res.json();
        if (data.success) setPorters((data.drivers as DriverRow[]).filter((d) => d.account_type === "porter"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Users className="h-6 w-6 text-brand-purple-700" /> Porters</h1>
          <p className="text-sm text-slate-500">Crew members who assist drivers on larger jobs — logged into the driver app with flat, per-assignment pay.</p>
        </div>
        <Link href="/admin/drivers/new" className="flex items-center gap-2 rounded-xl bg-brand-purple-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-900">
          <Plus className="h-4 w-4" /> Add Porter
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" /></div>
      ) : porters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          No porters yet. <Link href="/admin/drivers/new" className="font-medium text-brand-purple-700 hover:underline">Add your first porter</Link> — pick &quot;Porter&quot; as the account type.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {porters.map((p) => (
            <Link key={p.id} href={`/admin/drivers/${p.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-purple-300">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900">{p.preferred_name || p.first_name} {p.last_name}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {p.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {p.phone}</p>}
                {p.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {p.email}</p>}
                <p className="text-slate-500">{p.job_count} job{p.job_count === 1 ? "" : "s"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
