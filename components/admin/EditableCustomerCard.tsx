"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

/**
 * Customer Details card with inline editing of name / email / phone.
 * Calls onSaved() after a successful update so the parent can refresh (e.g. to
 * pick up a corrected email before re-sending a quote).
 */
export function EditableCustomerCard({
  customer,
  formatDate,
  onSaved,
}: {
  customer: Customer;
  formatDate: (d: string) => string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(customer.full_name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);

  function startEdit() {
    setName(customer.full_name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setEditing(true);
  }

  async function save() {
    if (name.trim().length < 2) { toast.error("Please enter the customer's name"); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { toast.error("Please enter a valid email"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer details updated");
        setEditing(false);
        onSaved();
      } else {
        toast.error(data.error || "Failed to update customer");
      }
    } catch {
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Customer Details</h3>
        {!editing ? (
          <button onClick={startEdit} className="flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:text-brand-purple-800">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-1 text-xs font-medium text-brand-green-700 hover:text-brand-green-900 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
            </button>
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <>
          <p className="text-base font-bold text-slate-900">{customer.full_name}</p>
          <a href={`mailto:${customer.email}`} className="mt-1.5 flex items-center gap-2 text-sm text-brand-purple-700 hover:underline"><Mail className="h-4 w-4" />{customer.email}</a>
          <a href={`tel:${customer.phone}`} className="mt-1 flex items-center gap-2 text-sm text-brand-purple-700 hover:underline"><Phone className="h-4 w-4" />{customer.phone}</a>
          <p className="mt-2 text-xs text-slate-400">Customer since {formatDate(customer.created_at)}</p>
          <Link href={`/admin/customers/${customer.id}`} className="mt-1 text-xs text-brand-purple-600 hover:underline">View all bookings from this customer →</Link>
        </>
      ) : (
        <div className="space-y-2.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
          </div>
          <p className="text-xs text-slate-400">Fix the email here, then re-send the quote — it&apos;ll go to the corrected address.</p>
        </div>
      )}
    </div>
  );
}
