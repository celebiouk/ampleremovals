"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Eye, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { TableSkeleton } from "@/components/admin/AdminSkeleton";
import { formatDate } from "@/lib/utils";
import { ALL_STATUSES, STATUS_LABELS, SERVICE_LABELS_SHORT } from "@/lib/constants";
import type { BookingStatus, ServiceType } from "@/types";

const PAGE_SIZE = 20;
const IN_PROGRESS: BookingStatus[] = ["called","not_called","answered","not_answered","processing","pending","deposit_invoice_sent","deposit_paid_job_confirmed","full_invoice_sent","full_balance_paid"];

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface BookingRow {
  id: string; reference: string; service_type: ServiceType;
  status: BookingStatus; move_date: string | null; is_flexible_date: boolean;
  created_at: string; customer_name: string;
  origin_postcode: string; destination_postcode: string | null;
}

function BookingsListInner() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const search = sp.get("search") ?? "";
  const service = sp.get("service") ?? "";
  const status = sp.get("status") ?? "";
  const page = Number(sp.get("page") ?? "1");

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<BookingStatus | "">("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const searchRef = useRef<NodeJS.Timeout | null>(null);
  const [searchInput, setSearchInput] = useState(search);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const push = useCallback((params: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  }, [router, pathname, sp]);

  // Check user role on mount
  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("admin_users")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setUserRole(data?.role ?? null);
      }
    };
    checkRole();
  }, []);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setSelected(new Set());
    const supabase = createClient();
    const from = (page - 1) * PAGE_SIZE;

    let q = supabase
      .from("bookings")
      .select("id,reference,service_type,status,move_date,is_flexible_date,created_at,customers!inner(full_name),origin_addr:addresses!origin_address_id(postcode),dest_addr:addresses!destination_address_id(postcode)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (service) q = q.eq("service_type", service);
    if (status) {
      if (status === "in_progress") q = q.in("status", IN_PROGRESS);
      else q = q.eq("status", status as BookingStatus);
    }

    const { data, count } = await q;

    let rows: BookingRow[] = (data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string, reference: b.reference as string,
      service_type: b.service_type as ServiceType, status: b.status as BookingStatus,
      move_date: b.move_date as string | null, is_flexible_date: b.is_flexible_date as boolean,
      created_at: b.created_at as string,
      customer_name: (b.customers as { full_name: string } | null)?.full_name ?? "—",
      origin_postcode: (b.origin_addr as { postcode: string } | null)?.postcode ?? "—",
      destination_postcode: (b.dest_addr as { postcode: string } | null)?.postcode ?? null,
    }));

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(b =>
        b.reference.toLowerCase().includes(s) ||
        b.customer_name.toLowerCase().includes(s) ||
        b.origin_postcode.toLowerCase().includes(s)
      );
    }

    setBookings(rows);
    setTotal(count ?? 0);
    setIsLoading(false);
  }, [page, service, status, search]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => push({ search: val }), 300);
  };

  const deleteBooking = async (id: string, reference: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete booking ${reference}?\n\nThis will delete:\n- The booking and all details\n- Customer information\n- Notes and history\n- Invoices and quotes\n\nThis action CANNOT be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Booking deleted successfully");
        loadBookings(); // Refresh list
      } else {
        toast.error(data.error || "Failed to delete booking");
      }
    } catch {
      toast.error("Failed to delete booking");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === bookings.length ? new Set() : new Set(bookings.map(b => b.id)));
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setIsBulkUpdating(true);
    const res = await fetch("/api/admin/bookings/bulk-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingIds: Array.from(selected), status: bulkStatus }),
    });
    const data = await res.json() as { success: boolean; updated?: number };
    if (data.success) {
      toast.success(`${data.updated} booking${(data.updated ?? 0) > 1 ? "s" : ""} updated to ${STATUS_LABELS[bulkStatus as BookingStatus]}`);
      setSelected(new Set());
      setBulkStatus("");
      loadBookings();
    } else {
      toast.error("Failed to update bookings");
    }
    setIsBulkUpdating(false);
  };

  const hasFilters = search || service || status;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Bookings</h2>
          <p className="text-sm text-slate-500">{total} total bookings</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchInput} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search reference, name, postcode…"
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-purple-400 focus:ring-1 focus:ring-brand-purple-100" />
        </div>
        <select value={service} onChange={e => push({ service: e.target.value })}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400">
          <option value="">All Services</option>
          {(Object.entries(SERVICE_LABELS_SHORT) as [ServiceType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={status} onChange={e => push({ status: e.target.value })}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setSearchInput(""); push({ search: "", service: "", status: "" }); }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-purple-200 bg-brand-purple-50 px-4 py-3">
          <span className="text-sm font-semibold text-brand-purple-800">{selected.size} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as BookingStatus | "")}
            className="h-8 rounded-lg border border-brand-purple-200 bg-white px-2 text-sm outline-none">
            <option value="">Change status to…</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button disabled={!bulkStatus || isBulkUpdating} onClick={handleBulkUpdate}
            className="rounded-lg bg-brand-purple-800 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
            {isBulkUpdating ? "Updating…" : "Apply"}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-slate-500 hover:text-slate-700">Cancel</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4"><TableSkeleton rows={8} /></div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-500">No bookings match your filters</p>
            {hasFilters && <button onClick={() => { setSearchInput(""); push({ search: "", service: "", status: "" }); }} className="mt-2 text-sm text-brand-purple-600 hover:underline">Clear filters</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={selected.size === bookings.length} onChange={toggleAll}
                      className="rounded border-slate-300 accent-brand-purple-700" />
                  </th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Origin</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-left">Move Date</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} onClick={() => router.push(`/admin/bookings/${b.id}`)}
                    className={`cursor-pointer border-b ${
                      b.status === "inquiry"
                        ? "bg-red-50 hover:bg-red-100 border-red-100"
                        : "border-slate-50 hover:bg-slate-50"
                    }`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)}
                        className="rounded border-slate-300 accent-brand-purple-700" />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-brand-purple-700">{b.reference}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{b.customer_name}</td>
                    <td className="px-4 py-3"><ServiceBadge service={b.service_type} /></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.origin_postcode}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.destination_postcode ?? "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.is_flexible_date ? "Flexible" : b.move_date ? formatDate(b.move_date) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{relativeTime(b.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => router.push(`/admin/bookings/${b.id}`)}
                          className="flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:underline">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {userRole === "super_admin" && (
                          <button
                            onClick={() => deleteBooking(b.id, b.reference)}
                            disabled={deletingId === b.id}
                            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                            title="Delete booking (Super Admin only)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === b.id ? "..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-sm text-slate-500">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1}
                onClick={() => { const p = new URLSearchParams(sp.toString()); p.set("page", String(page - 1)); router.push(`${pathname}?${p.toString()}`); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-slate-700">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages}
                onClick={() => { const p = new URLSearchParams(sp.toString()); p.set("page", String(page + 1)); router.push(`${pathname}?${p.toString()}`); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  return <Suspense fallback={<div className="p-4"><TableSkeleton rows={10} /></div>}><BookingsListInner /></Suspense>;
}
