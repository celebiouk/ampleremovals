"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import type { BookingStatus, ServiceType } from "@/types";

interface CustomerDetail {
  id: string; full_name: string; email: string; phone: string; created_at: string;
}
interface BookingRow {
  id: string; reference: string; service_type: ServiceType; status: BookingStatus;
  move_date: string | null; is_flexible_date: boolean; created_at: string;
  origin_postcode: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  async function saveCustomer() {
    if (form.full_name.trim().length < 2) { toast.error("Please enter the customer's name"); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { toast.error("Please enter a valid email"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer details updated");
        setCustomer((c) => (c ? { ...c, ...data.customer } : c));
        setEditing(false);
      } else toast.error(data.error || "Failed to update");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: cust }, { data: bkgs }] = await Promise.all([
        supabase.from("customers").select("*").eq("id", customerId).single(),
        supabase.from("bookings").select("id,reference,service_type,status,move_date,is_flexible_date,created_at,origin_addr:addresses!origin_address_id(postcode)")
          .eq("customer_id", customerId).order("created_at", { ascending: false }),
      ]);
      setCustomer(cust as CustomerDetail);
      setBookings((bkgs ?? []).map((b: Record<string, unknown>) => ({
        id: b.id as string, reference: b.reference as string,
        service_type: b.service_type as ServiceType, status: b.status as BookingStatus,
        move_date: b.move_date as string | null, is_flexible_date: b.is_flexible_date as boolean,
        created_at: b.created_at as string,
        origin_postcode: (b.origin_addr as { postcode: string } | null)?.postcode ?? "—",
      })));
      setIsLoading(false);
    };
    load();
  }, [customerId]);

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!customer) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="font-semibold text-slate-600">Customer not found</p>
      <Link href="/admin/customers" className="mt-3 flex items-center gap-1 text-sm text-brand-purple-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/admin" className="hover:text-slate-600">Admin</Link>
            <span>/</span>
            <Link href="/admin/customers" className="hover:text-slate-600">Customers</Link>
            <span>/</span>
            <span className="text-slate-700">{customer.full_name}</span>
          </nav>
          <h2 className="font-display text-2xl font-bold text-slate-900">{customer.full_name}</h2>
        </div>
        <Link href="/admin/customers" className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Customer Info</h3>
          {!editing ? (
            <button onClick={() => { setForm({ full_name: customer.full_name, email: customer.email, phone: customer.phone }); setEditing(true); }} className="flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:text-brand-purple-800">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={saveCustomer} disabled={saving} className="flex items-center gap-1 text-xs font-medium text-brand-green-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /> Cancel</button>
            </div>
          )}
        </div>
        {!editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</p>
              <p className="mt-1 font-semibold text-slate-800">{customer.full_name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
              <a href={`mailto:${customer.email}`} className="mt-1 flex items-center gap-1.5 text-sm text-brand-purple-700 hover:underline">
                <Mail className="h-4 w-4" />{customer.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</p>
              <a href={`tel:${customer.phone}`} className="mt-1 flex items-center gap-1.5 text-sm text-brand-purple-700 hover:underline">
                <Phone className="h-4 w-4" />{customer.phone}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer Since</p>
              <p className="mt-1 text-sm text-slate-700">{formatDate(customer.created_at)}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Booking History ({bookings.length})</h3>
        </div>
        {bookings.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No bookings yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Postcode</th>
                  <th className="px-4 py-3 text-left">Move Date</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} onClick={() => router.push(`/admin/bookings/${b.id}`)}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-brand-purple-700">{b.reference}</td>
                    <td className="px-4 py-3"><ServiceBadge service={b.service_type} /></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.origin_postcode}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.is_flexible_date ? "Flexible" : b.move_date ? formatDate(b.move_date) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(b.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
