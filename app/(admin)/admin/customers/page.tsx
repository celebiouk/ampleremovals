"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TableSkeleton } from "@/components/admin/AdminSkeleton";
import { formatDate } from "@/lib/utils";

interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  booking_count: number;
  last_booking_date: string | null;
}

function CustomersListInner() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchRef = useRef<NodeJS.Timeout | null>(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const from = (page - 1) * PAGE_SIZE;

    const { data, count } = await supabase
      .from("customers")
      .select("id, full_name, email, phone, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const ids = (data ?? []).map((c: { id: string }) => c.id);
    const bookingCounts: Record<string, number> = {};
    const lastDates: Record<string, string> = {};

    if (ids.length > 0) {
      const { data: bData } = await supabase
        .from("bookings")
        .select("customer_id, created_at")
        .in("customer_id", ids);

      (bData ?? []).forEach((b: { customer_id: string; created_at: string }) => {
        bookingCounts[b.customer_id] = (bookingCounts[b.customer_id] ?? 0) + 1;
        if (!lastDates[b.customer_id] || b.created_at > lastDates[b.customer_id]) {
          lastDates[b.customer_id] = b.created_at;
        }
      });
    }

    let rows: CustomerRow[] = (data ?? []).map((c: { id: string; full_name: string; email: string; phone: string; created_at: string }) => ({
      ...c,
      booking_count: bookingCounts[c.id] ?? 0,
      last_booking_date: lastDates[c.id] ?? null,
    }));

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(c =>
        c.full_name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s)
      );
    }

    setCustomers(rows);
    setTotal(count ?? 0);
    setIsLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Customers</h2>
        <p className="text-sm text-slate-500">{total} total customers</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input onChange={e => handleSearch(e.target.value)} placeholder="Search by name, email or phone…"
          className="h-10 w-full max-w-sm rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-purple-400" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? <div className="p-4"><TableSkeleton rows={8} /></div> :
        customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-500">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Bookings</th>
                  <th className="px-4 py-3 text-left">Last Booking</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} onClick={() => router.push(`/admin/customers/${c.id}`)}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{c.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.phone}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-purple-700">{c.booking_count}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.last_booking_date ? formatDate(c.last_booking_date) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => router.push(`/admin/customers/${c.id}`)}
                        className="flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:underline">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCustomersPage() {
  return <Suspense fallback={<div className="p-4"><TableSkeleton rows={10} /></div>}><CustomersListInner /></Suspense>;
}
