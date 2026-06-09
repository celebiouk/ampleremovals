"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Copy, Check, Mail, Phone, MessageSquare, Smartphone,
  ArrowRight, Plus, Receipt, Trash2, ChevronDown, ChevronUp, Loader2,
  ExternalLink, Bell, Truck, Clock, MapPin, CheckCircle, Save, X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useBookingDetail } from "@/hooks/useBookingDetail";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { GenerateInvoiceModal } from "@/components/admin/invoices/GenerateInvoiceModal";
import { InvoiceDetailModal } from "@/components/admin/invoices/InvoiceDetailModal";
import { DeleteInvoiceDialog } from "@/components/admin/invoices/DeleteInvoiceDialog";
import { QuoteBuilderModal } from "@/components/admin/quotes/QuoteBuilderModal";
import { CallBackReminderModal } from "@/components/admin/CallBackReminderModal";
import { DocumentsPanel } from "@/components/admin/documents/DocumentsPanel";
import { AssignedDrivers } from "@/components/admin/drivers/AssignedDrivers";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import { EMAIL_TEMPLATES, TEMPLATE_CATEGORIES, type EmailTemplate } from "@/lib/email-templates";
import { STATUS_LABELS, STATUS_DOT_COLOURS, ALL_STATUSES, SERVICE_LABELS } from "@/lib/constants";
import type { BookingStatus, ServiceType } from "@/types";

function formatAddress(addr: { line_1: string; line_2?: string | null; city?: string | null; postcode: string } | null): string {
  if (!addr) return "N/A";
  return [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
}

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const { data, isLoading, error, refresh } = useBookingDetail(bookingId);

  const [copied, setCopied] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "">("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [smsExpanded, setSmsExpanded] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [generateInvoiceType, setGenerateInvoiceType] = useState<"deposit" | "full_balance" | null>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [deleteInvoiceDialogOpen, setDeleteInvoiceDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; number: string; type: string; amount: number } | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [callBackReminderOpen, setCallBackReminderOpen] = useState(false);
  const [updatingDriverStatus, setUpdatingDriverStatus] = useState(false);
  const [templateCategory, setTemplateCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  // Edit modals
  const [editDateModalOpen, setEditDateModalOpen] = useState(false);
  const [editAddressModalOpen, setEditAddressModalOpen] = useState(false);
  const [editMoveDate, setEditMoveDate] = useState("");
  const [editMoveTime, setEditMoveTime] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Get user email on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
    };
    getUser();
  }, []);

  // Open delete invoice dialog
  const openDeleteInvoiceDialog = (invoice: { id: string; invoice_number: string; type: string; total: number }) => {
    setInvoiceToDelete({
      id: invoice.id,
      number: invoice.invoice_number,
      type: invoice.type,
      amount: invoice.total
    });
    setDeleteInvoiceDialogOpen(true);
  };

  // Confirm delete invoice
  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    setDeletingInvoiceId(invoiceToDelete.id);
    setDeleteInvoiceDialogOpen(false);

    try {
      const res = await fetch(`/api/admin/invoices/${invoiceToDelete.id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Invoice deleted successfully");
        refresh(); // Refresh booking data
      } else {
        toast.error(data.error || "Failed to delete invoice");
      }
    } catch {
      toast.error("Failed to delete invoice");
    } finally {
      setDeletingInvoiceId(null);
      setInvoiceToDelete(null);
    }
  };

  // Update driver status
  const updateDriverStatus = async (status: string, statusLabel: string) => {
    if (!window.confirm(`Are you sure you want to mark: ${statusLabel}?\n\nThis will send Email, SMS, and WhatsApp to the customer.`)) {
      return;
    }

    setUpdatingDriverStatus(true);

    try {
      const res = await fetch("/api/admin/driver-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${statusLabel} - Customer notified!`);
        refresh();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingDriverStatus(false);
    }
  };

  const activityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data && activityRef.current) activityRef.current.scrollTop = activityRef.current.scrollHeight;
  }, [data]);

  useEffect(() => {
    if (data) {
      setSelectedStatus(data.booking.status);
      setEmailSubject(`Re: Your booking ${data.booking.reference}`);
    }
  }, [data]);

  const copyReference = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.booking.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateStatus = async () => {
    if (!selectedStatus || selectedStatus === data?.booking.status) return;
    setIsUpdatingStatus(true);
    const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: selectedStatus }),
    });
    const json = await res.json() as { success: boolean };
    if (json.success) { toast.success(`Status updated to ${STATUS_LABELS[selectedStatus]}`); refresh(); }
    else toast.error("Failed to update status");
    setIsUpdatingStatus(false);
  };

  const addNote = async () => {
    if (newNote.trim().length < 3) return;
    setIsAddingNote(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("booking_notes").insert({ booking_id: bookingId, note: newNote.trim(), created_by: "admin" });
    if (!err) {
      await supabase.from("activity_log").insert({ booking_id: bookingId, action: "Note added", metadata: { note_preview: newNote.slice(0, 80) }, performed_by: "admin" });
      toast.success("Note added"); setNewNote(""); refresh();
    } else toast.error("Failed to add note");
    setIsAddingNote(false);
  };

  const deleteNote = async (noteId: string) => {
    const supabase = createClient();
    await supabase.from("booking_notes").delete().eq("id", noteId);
    await supabase.from("activity_log").insert({ booking_id: bookingId, action: "Note deleted", metadata: {}, performed_by: "admin" });
    toast.success("Note deleted"); setDeletingNoteId(null); refresh();
  };

  const sendEmail = async () => {
    if (emailBody.length < 5) return;
    setIsSendingEmail(true);
    // Build SMS version: use template SMS body or derive from email body
    const smsText = selectedTemplate
      ? selectedTemplate.smsBody
          .replace(/\{\{name\}\}/g, data?.customer.full_name.split(" ")[0] ?? "")
          .replace(/\{\{service\}\}/g, data?.booking.service_type ?? "")
          .replace(/\{\{ref\}\}/g, data?.booking.reference ?? "")
          .replace(/\{\{company_phone\}\}/g, "07344 683477")
          .replace(/\{\{company_name\}\}/g, "Ample Removals")
      : undefined;
    const res = await fetch("/api/admin/send-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, subject: emailSubject, message: emailBody, smsMessage: smsText }),
    });
    const json = await res.json() as { success: boolean };
    if (json.success) {
      toast.success(selectedTemplate ? "Email + SMS sent" : "Email sent");
      setEmailExpanded(false); setEmailBody(""); setSelectedTemplate(null); refresh();
    } else toast.error("Failed to send email");
    setIsSendingEmail(false);
  };

  const sendSMS = async () => {
    if (!smsBody.trim()) return;
    setIsSendingSMS(true);
    const res = await fetch("/api/admin/send-sms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, message: smsBody }),
    });
    const json = await res.json() as { success: boolean };
    if (json.success) { toast.success("SMS sent successfully"); setSmsExpanded(false); setSmsBody(""); refresh(); }
    else toast.error("Failed to send SMS");
    setIsSendingSMS(false);
  };

  const activityIcon = (action: string) => {
    if (action.includes("Status")) return <ArrowRight className="h-3.5 w-3.5" />;
    if (action.includes("Note")) return <MessageSquare className="h-3.5 w-3.5" />;
    if (action.includes("email") || action.includes("Email")) return <Mail className="h-3.5 w-3.5" />;
    if (action.includes("SMS") || action.includes("sms")) return <Smartphone className="h-3.5 w-3.5" />;
    if (action.includes("Invoice")) return <Receipt className="h-3.5 w-3.5" />;
    return <Plus className="h-3.5 w-3.5" />;
  };

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[55fr_45fr]">
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-semibold text-slate-600">{error ?? "Booking not found"}</p>
      <Link href="/admin/bookings" className="mt-3 flex items-center gap-1 text-sm text-brand-purple-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </Link>
    </div>
  );

  const { booking, customer, originAddress, destinationAddress,
    removalsDetails, manAndVanDetails, houseClearanceDetails,
    houseCleaningDetails, endOfTenancyDetails, additionalServices,
    notes, statusHistory, activityLog, invoices } = data;

  const visibleHistory = showAllHistory ? statusHistory : statusHistory.slice(0, 5);

  const Card = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="mb-1 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/admin" className="hover:text-slate-600">Admin</Link>
            <span>/</span>
            <Link href="/admin/bookings" className="hover:text-slate-600">Bookings</Link>
            <span>/</span>
            <span className="font-mono text-slate-700">{booking.reference}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-2xl font-bold text-slate-900">{booking.reference}</h2>
            <button onClick={copyReference} className="text-slate-400 hover:text-slate-600">
              {copied ? <Check className="h-4 w-4 text-brand-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
            <ServiceBadge service={booking.service_type} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Submitted {formatDate(booking.created_at)} at {new Date(booking.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Link href="/admin/bookings" className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[55fr_45fr]">

        {/* LEFT PANEL */}
        <div className="space-y-5">
          <Card title="Customer Details">
            <p className="text-base font-bold text-slate-900">{customer.full_name}</p>
            <a href={`mailto:${customer.email}`} className="mt-1.5 flex items-center gap-2 text-sm text-brand-purple-700 hover:underline"><Mail className="h-4 w-4" />{customer.email}</a>
            <a href={`tel:${customer.phone}`} className="mt-1 flex items-center gap-2 text-sm text-brand-purple-700 hover:underline"><Phone className="h-4 w-4" />{customer.phone}</a>
            <p className="mt-2 text-xs text-slate-400">Customer since {formatDate(customer.created_at)}</p>
            <Link href={`/admin/customers/${customer.id}`} className="mt-1 text-xs text-brand-purple-600 hover:underline">View all bookings from this customer →</Link>
          </Card>

          <Card
            title="Booking Details"
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditMoveDate(booking.move_date || "");
                    setEditMoveTime("");
                    setEditDateModalOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Edit Date
                </button>
                <button
                  onClick={() => setEditAddressModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Edit Address
                </button>
              </div>
            }
          >
            <dl className="space-y-3 text-sm">
              {[
                ["Service", SERVICE_LABELS[booking.service_type]],
                ["Origin Address", formatAddress(originAddress)],
                ["Destination", formatAddress(destinationAddress)],
                ["Move Date", booking.is_flexible_date && booking.flexible_date_from && booking.flexible_date_to
                  ? `Flexible: ${formatDate(booking.flexible_date_from)} – ${formatDate(booking.flexible_date_to)}`
                  : booking.move_date ? formatDate(booking.move_date) : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                  <dt className="shrink-0 text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-800 sm:text-right max-w-xs">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Service Details">
            <dl className="space-y-3 text-sm">
              {removalsDetails && (<>
                <div className="flex justify-between"><dt className="text-slate-500">Removal Type</dt><dd className="font-medium capitalize">{removalsDetails.removal_type}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Property</dt><dd className="font-medium capitalize">{removalsDetails.property_type}, {removalsDetails.bedrooms} bed</dd></div>
              </>)}
              {manAndVanDetails && <div className="flex justify-between"><dt className="text-slate-500">Van Type</dt><dd className="font-medium capitalize">{manAndVanDetails.van_type}</dd></div>}
              {houseClearanceDetails && (<>
                <div className="flex justify-between"><dt className="text-slate-500">Clearance Type</dt><dd className="font-medium capitalize">{houseClearanceDetails.clearance_type.replace("_", " ")}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Property</dt><dd className="font-medium">{houseClearanceDetails.property_type}, {houseClearanceDetails.bedrooms} bed</dd></div>
                {(houseClearanceDetails.items_of_note?.length ?? 0) > 0 && <div className="flex flex-col gap-0.5"><dt className="text-slate-500">Items of Note</dt><dd className="font-medium">{houseClearanceDetails.items_of_note?.join(", ")}</dd></div>}
              </>)}
              {houseCleaningDetails && (<>
                <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd className="font-medium capitalize">{houseCleaningDetails.cleaning_type.replace("_", " ")}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Frequency</dt><dd className="font-medium capitalize">{houseCleaningDetails.frequency.replace("_", " ")}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Time Slot</dt><dd className="font-medium capitalize">{houseCleaningDetails.preferred_time_slot ?? "—"}</dd></div>
                {houseCleaningDetails.access_instructions && <div className="flex flex-col gap-0.5"><dt className="text-slate-500">Access</dt><dd className="font-medium">{houseCleaningDetails.access_instructions}</dd></div>}
              </>)}
              {endOfTenancyDetails && (<>
                <div className="flex justify-between"><dt className="text-slate-500">Property</dt><dd className="font-medium">{endOfTenancyDetails.property_type}, {endOfTenancyDetails.bedrooms} bed</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Tenancy End</dt><dd className="font-medium">{endOfTenancyDetails.tenancy_end_date ? formatDate(endOfTenancyDetails.tenancy_end_date) : "—"}</dd></div>
                {(endOfTenancyDetails.addons?.length ?? 0) > 0 && <div className="flex flex-col gap-0.5"><dt className="text-slate-500">Add-ons</dt><dd className="font-medium">{endOfTenancyDetails.addons?.join(", ")}</dd></div>}
                {endOfTenancyDetails.access_instructions && <div className="flex flex-col gap-0.5"><dt className="text-slate-500">Access</dt><dd className="font-medium">{endOfTenancyDetails.access_instructions}</dd></div>}
              </>)}
            </dl>
          </Card>

          {additionalServices && (
            <Card title="Additional Services">
              {[additionalServices.packing_services && "Packing Services", additionalServices.packing_materials && "Packing Materials", additionalServices.disassemble_furniture && "Disassemble Furniture", additionalServices.assemble_furniture && "Assemble Furniture"].filter(Boolean).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {[additionalServices.packing_services && "Packing Services", additionalServices.packing_materials && "Packing Materials", additionalServices.disassemble_furniture && "Disassemble Furniture", additionalServices.assemble_furniture && "Assemble Furniture"].filter(Boolean).map(s => (
                    <span key={s as string} className="rounded-full bg-brand-green-50 px-3 py-1 text-xs font-medium text-brand-green-800">{s as string}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No additional services requested</p>}
            </Card>
          )}

          <Card title="Description">
            {booking.description ? (
              <blockquote className="rounded-xl border-l-4 border-brand-purple-300 bg-slate-50 p-4 text-sm italic leading-relaxed text-slate-700">&ldquo;{booking.description}&rdquo;</blockquote>
            ) : <p className="text-sm text-slate-400">No description provided</p>}
          </Card>

          {/* Documents Panel */}
          <DocumentsPanel bookingId={bookingId} />

          <Card title="Quote">
            {booking.quote_total && booking.quote_line_items && Array.isArray(booking.quote_line_items) ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-green-900">Quote Total</span>
                    <span className="text-lg font-bold text-green-900">{formatCurrency(booking.quote_total)}</span>
                  </div>
                  {booking.quote_sent_at && (
                    <p className="text-xs text-green-700">Sent to customer on {formatDate(booking.quote_sent_at)}</p>
                  )}
                  {booking.quote_valid_until && (
                    <p className="text-xs text-green-700">Valid until {formatDate(booking.quote_valid_until)}</p>
                  )}
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-semibold">Line Items:</p>
                  {booking.quote_line_items.map((item: { description: string; quantity: number; unit_price: number; total: number }, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.description} (x{item.quantity})</span>
                      <span className="font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
                {booking.quote_pdf_url && (
                  <a href={booking.quote_pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-purple-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> View Quote PDF
                  </a>
                )}
                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="w-full rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100">
                  Edit Quote
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-sm text-slate-400">No quote created yet</p>
                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="rounded-xl border border-brand-purple-200 bg-brand-purple-50 px-3 py-2 text-sm font-medium text-brand-purple-800 hover:bg-brand-purple-100">
                  + Create Quote
                </button>
              </div>
            )}
          </Card>

          <Card title="Invoices">
            {invoices.length > 0 ? (
              <div className="mb-4 space-y-2">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-mono font-semibold text-brand-purple-700">{inv.invoice_number}</span>
                    <span className="capitalize text-slate-500">{inv.type.replace("_", " ")}</span>
                    <span className="font-semibold">{formatCurrency(inv.total)}</span>
                    <StatusBadge status={inv.status as BookingStatus} />
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => setViewingInvoiceId(inv.id)} className="flex items-center gap-1 text-xs text-brand-purple-600 hover:underline">
                        <ExternalLink className="h-3 w-3" /> View
                      </button>
                      {userEmail === "ampleremovals@gmail.com" && (
                        <button
                          onClick={() => openDeleteInvoiceDialog(inv)}
                          disabled={deletingInvoiceId === inv.id}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                          title="Delete invoice (Super Admin only)"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingInvoiceId === inv.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Totals */}
                <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                  {[
                    ["Total Invoiced", invoices.reduce((a, i) => a + i.total, 0)],
                    ["Total Paid", invoices.filter(i => i.status === "paid").reduce((a, i) => a + i.total, 0)],
                    ["Outstanding", invoices.filter(i => ["sent","overdue"].includes(i.status)).reduce((a, i) => a + i.total, 0)],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between">
                      <span className="text-slate-500">{label as string}</span>
                      <span className="font-semibold">{formatCurrency(val as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="mb-4 text-sm text-slate-400">No invoices yet</p>}
            <div className="flex gap-2">
              {(() => {
                const hasDeposit = invoices.some(i => i.type === "deposit" && i.status !== "cancelled");
                const hasFull = invoices.some(i => i.type === "full_balance" && i.status !== "cancelled");
                return <>
                  <button onClick={() => setGenerateInvoiceType("deposit")} disabled={hasDeposit}
                    title={hasDeposit ? "A deposit invoice already exists" : undefined}
                    className="rounded-xl border border-brand-purple-200 bg-brand-purple-50 px-3 py-2 text-sm font-medium text-brand-purple-800 hover:bg-brand-purple-100 disabled:cursor-not-allowed disabled:opacity-50">
                    + Deposit Invoice
                  </button>
                  <button onClick={() => setGenerateInvoiceType("full_balance")} disabled={hasFull}
                    title={hasFull ? "A full balance invoice already exists" : undefined}
                    className="rounded-xl border border-brand-purple-200 bg-brand-purple-50 px-3 py-2 text-sm font-medium text-brand-purple-800 hover:bg-brand-purple-100 disabled:cursor-not-allowed disabled:opacity-50">
                    + Full Balance Invoice
                  </button>
                </>;
              })()}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-5">
          {/* Quick Actions - Call Back Reminders & Quote Builder */}
          <Card title="Quick Actions">
            <div className="space-y-2">
              <button
                onClick={() => setCallBackReminderOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Bell className="h-4 w-4" />
                Set Call Back Reminder
              </button>
              <button
                onClick={() => setQuoteModalOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Receipt className="h-4 w-4" />
                Build Quote
              </button>
            </div>
          </Card>

          {/* Driver Status Actions */}
          <Card title="Driver Status">
            <div className="space-y-2">
              <button
                onClick={() => updateDriverStatus("on_my_way", "Driver On My Way")}
                disabled={updatingDriverStatus}
                className="flex w-full items-center gap-2 rounded-xl border border-blue-500 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <Truck className="h-4 w-4" />
                On My Way
              </button>
              <button
                onClick={() => updateDriverStatus("20_mins_away", "Driver 20 Minutes Away")}
                disabled={updatingDriverStatus}
                className="flex w-full items-center gap-2 rounded-xl border border-orange-500 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900 hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                20 Minutes Away
              </button>
              <button
                onClick={() => updateDriverStatus("10_mins_away", "Driver 10 Minutes Away")}
                disabled={updatingDriverStatus}
                className="flex w-full items-center gap-2 rounded-xl border border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                10 Minutes Away
              </button>
              <button
                onClick={() => updateDriverStatus("15_mins_to_delivery", "15 Minutes to Delivery")}
                disabled={updatingDriverStatus}
                className="flex w-full items-center gap-2 rounded-xl border border-purple-500 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-900 hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                <MapPin className="h-4 w-4" />
                15 Mins to Delivery
              </button>
              <button
                onClick={() => updateDriverStatus("job_completed", "Job Completed")}
                disabled={updatingDriverStatus}
                className="flex w-full items-center gap-2 rounded-xl border-2 border-green-600 bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Job Completed
              </button>
            </div>
          </Card>

          {/* Assigned Drivers */}
          <AssignedDrivers bookingId={bookingId} bookingReference={booking.reference} />

          <Card title="Booking Status">
            <div className="mb-4"><StatusBadge status={booking.status} /></div>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as BookingStatus)}
              className="mb-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400">
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={updateStatus} disabled={isUpdatingStatus || selectedStatus === booking.status}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-purple-900">
              {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}Update Status
            </button>
          </Card>

          <Card title="Status History">
            {statusHistory.length === 0 ? <p className="text-sm text-slate-400">No status changes yet</p> : (
              <div className="space-y-3">
                {visibleHistory.map(h => (
                  <div key={h.id} className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_COLOURS[h.new_status]}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{STATUS_LABELS[h.new_status]}</p>
                      <p className="text-xs text-slate-400">{h.previous_status ? `From ${STATUS_LABELS[h.previous_status]}` : "Initial"} · {formatDate(h.changed_at)} · {h.changed_by}</p>
                    </div>
                  </div>
                ))}
                {statusHistory.length > 5 && (
                  <button onClick={() => setShowAllHistory(!showAllHistory)} className="flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:underline">
                    {showAllHistory ? <><ChevronUp className="h-3.5 w-3.5" />Show less</> : <><ChevronDown className="h-3.5 w-3.5" />Show all {statusHistory.length}</>}
                  </button>
                )}
              </div>
            )}
          </Card>

          <Card title="Internal Notes">
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note…" rows={3}
              className="mb-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-purple-400" />
            <button onClick={addNote} disabled={isAddingNote || newNote.trim().length < 3}
              className="mb-4 flex items-center gap-1.5 rounded-xl bg-brand-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {isAddingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Add Note
            </button>
            {notes.length === 0 ? <p className="text-sm text-slate-400">No notes yet. Add the first note above.</p> : (
              <div className="space-y-3">
                {notes.map(n => (
                  <div key={n.id} className="group relative rounded-xl bg-slate-50 p-4">
                    <p className="pr-6 text-sm text-slate-800">{n.note}</p>
                    <p className="mt-1 text-xs text-slate-400">Admin · {formatDate(n.created_at)}</p>
                    <button onClick={() => setDeletingNoteId(n.id)} className="absolute right-3 top-3 hidden text-slate-300 hover:text-red-500 group-hover:block">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Send email + templates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Send Email to Customer</h3>
              <button onClick={() => { setEmailExpanded(!emailExpanded); if (!emailExpanded) { setSelectedTemplate(null); setEmailSubject(""); setEmailBody(""); } }}
                className="text-sm font-medium text-brand-purple-600 hover:underline">
                {emailExpanded ? "Cancel" : "Compose Email"}
              </button>
            </div>
            {emailExpanded && (
              <div className="mt-4 space-y-4">
                {/* Template picker */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Choose a template</p>
                  {/* Category tabs */}
                  <div className="mb-3 flex gap-1 flex-wrap">
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setTemplateCategory(cat.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${templateCategory === cat.id ? "bg-brand-purple-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
                    {EMAIL_TEMPLATES.filter(t => templateCategory === "all" || t.category === templateCategory).map(t => (
                      <button key={t.id} onClick={() => {
                        setSelectedTemplate(t);
                        setEmailSubject(t.subject.replace(/\{\{service\}\}/g, booking.service_type).replace(/\{\{ref\}\}/g, booking.reference));
                        setEmailBody(t.body.replace(/\{\{name\}\}/g, customer.full_name).replace(/\{\{service\}\}/g, booking.service_type).replace(/\{\{ref\}\}/g, booking.reference).replace(/\{\{company_phone\}\}/g, "07344 683477").replace(/\{\{company_name\}\}/g, "Ample Removals"));
                      }}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${selectedTemplate?.id === t.id ? "border-brand-purple-400 bg-brand-purple-50 text-brand-purple-800" : "border-slate-100 bg-slate-50 text-slate-600 hover:border-brand-purple-200 hover:bg-white"}`}>
                        <span className="font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-purple-400" />
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Message…" rows={6}
                    className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-purple-400" />
                  {selectedTemplate && data && (
                    <p className="text-xs text-slate-400">
                      📱 SMS will also be sent: &ldquo;{selectedTemplate.smsBody
                        .replace(/\{\{name\}\}/g, data.customer.full_name.split(" ")[0])
                        .replace(/\{\{service\}\}/g, data.booking.service_type)
                        .replace(/\{\{ref\}\}/g, data.booking.reference)
                        .replace(/\{\{company_phone\}\}/g, "07344 683477")
                        .replace(/\{\{company_name\}\}/g, "Ample Removals")
                        .slice(0, 100)}…&rdquo;
                    </p>
                  )}
                  <button onClick={sendEmail} disabled={isSendingEmail || emailBody.length < 5}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                    {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send Email {selectedTemplate ? "+ SMS" : ""}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Send SMS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Send SMS to Customer</h3>
              <button onClick={() => setSmsExpanded(!smsExpanded)} className="text-sm font-medium text-brand-purple-600 hover:underline">
                {smsExpanded ? "Cancel" : "Compose SMS"}
              </button>
            </div>
            {smsExpanded && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <textarea value={smsBody} onChange={e => setSmsBody(e.target.value.slice(0, 160))} placeholder="Message (max 160 chars)" rows={4} maxLength={160}
                    className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-purple-400" />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-400">{smsBody.length}/160</span>
                </div>
                <button onClick={sendSMS} disabled={isSendingSMS || !smsBody.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple-800 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                  {isSendingSMS ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}Send SMS
                </button>
              </div>
            )}
          </div>

          {/* Activity log */}
          <Card title="Activity Log">
            <div ref={activityRef} className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {activityLog.length === 0 ? <p className="text-sm text-slate-400">No activity yet</p> : activityLog.map(entry => (
                <div key={entry.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple-50 text-brand-purple-700">
                    {activityIcon(entry.action)}
                  </span>
                  <div>
                    <p className="text-sm text-slate-800">{entry.action}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(entry.created_at)} · {entry.performed_by}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Invoice modal */}
      {data && generateInvoiceType && (
        <GenerateInvoiceModal
          isOpen={!!generateInvoiceType}
          onClose={() => setGenerateInvoiceType(null)}
          bookingId={bookingId}
          type={generateInvoiceType}
          bookingReference={data.booking.reference}
          customerName={data.customer.full_name}
          serviceType={data.booking.service_type as ServiceType}
          additionalServices={data.additionalServices}
          quoteTotal={data.booking.quote_total}
          onSuccess={() => { refresh(); setGenerateInvoiceType(null); }}
        />
      )}

      {/* Quote modal */}
      {data && (
        <QuoteBuilderModal
          bookingId={bookingId}
          bookingReference={data.booking.reference}
          existingQuote={
            data.booking.quote_line_items && Array.isArray(data.booking.quote_line_items)
              ? {
                  line_items: data.booking.quote_line_items,
                  subtotal: data.booking.quote_subtotal || 0,
                  vat_rate: data.booking.quote_vat_rate || 20,
                  vat_amount: data.booking.quote_vat_amount || 0,
                  total: data.booking.quote_total || 0,
                  valid_until: data.booking.quote_valid_until,
                  notes: data.booking.quote_notes,
                }
              : undefined
          }
          serviceData={{
            service_type: data.booking.service_type,
            removal_type: data.removalsDetails?.removal_type,
            bedrooms: data.removalsDetails?.bedrooms || data.houseClearanceDetails?.bedrooms || data.endOfTenancyDetails?.bedrooms,
            property_type: data.removalsDetails?.property_type || data.houseClearanceDetails?.property_type || data.endOfTenancyDetails?.property_type,
            origin_city: data.originAddress?.city || undefined,
            destination_city: data.destinationAddress?.city || undefined,
            origin_postcode: data.originAddress?.postcode || undefined,
            destination_postcode: data.destinationAddress?.postcode || undefined,
            additional_services: data.additionalServices ? [
              data.additionalServices.packing_services && { name: "Packing Services", price: 50 },
              data.additionalServices.packing_materials && { name: "Packing Materials", price: 20 },
              data.additionalServices.disassemble_furniture && { name: "Disassemble Furniture", price: 0 },
              data.additionalServices.assemble_furniture && { name: "Assemble Furniture", price: 0 },
            ].filter(Boolean) as Array<{ name: string; price?: number }> : undefined,
          }}
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          onSaved={refresh}
        />
      )}
      <InvoiceDetailModal
        isOpen={!!viewingInvoiceId}
        onClose={() => setViewingInvoiceId(null)}
        invoiceId={viewingInvoiceId}
        onActionComplete={refresh}
      />

      <DeleteInvoiceDialog
        isOpen={deleteInvoiceDialogOpen}
        onClose={() => {
          setDeleteInvoiceDialogOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        invoiceNumber={invoiceToDelete?.number || ""}
        invoiceType={invoiceToDelete?.type.replace("_", " ") || ""}
        amount={invoiceToDelete?.amount || 0}
      />

      <CallBackReminderModal
        isOpen={callBackReminderOpen}
        onClose={() => setCallBackReminderOpen(false)}
        bookingId={booking.id}
        customerId={customer.id}
        customerName={customer.full_name}
        bookingReference={booking.reference}
        onSaved={refresh}
      />

      <ConfirmDialog isOpen={deletingNoteId !== null} title="Delete note"
        description="Are you sure? This cannot be undone." confirmLabel="Delete" confirmVariant="destructive"
        onConfirm={() => deletingNoteId && deleteNote(deletingNoteId)} onCancel={() => setDeletingNoteId(null)} />

      {/* Edit Date Modal */}
      {editDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Edit Move Date & Time</h3>
              <button onClick={() => setEditDateModalOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Move Date *</label>
                <input
                  type="date"
                  value={editMoveDate}
                  onChange={(e) => setEditMoveDate(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time (Optional)</label>
                <input
                  type="time"
                  value={editMoveTime}
                  onChange={(e) => setEditMoveTime(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">Leave blank if time not confirmed</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditDateModalOpen(false)}
                  className="rounded-xl border-2 border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editMoveDate) {
                      toast.error("Please select a date");
                      return;
                    }
                    setIsSavingEdit(true);
                    try {
                      const res = await fetch(`/api/admin/bookings/${bookingId}/update-date`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ moveDate: editMoveDate, moveTime: editMoveTime, notify: false }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Move date updated (customer not notified)");
                        setEditDateModalOpen(false);
                        refresh();
                      } else {
                        toast.error(data.error || "Failed to update date");
                      }
                    } catch {
                      toast.error("Failed to update date");
                    } finally {
                      setIsSavingEdit(false);
                    }
                  }}
                  disabled={isSavingEdit}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Only
                    </>
                  )}
                </button>
                <button
                  onClick={async () => {
                    if (!editMoveDate) {
                      toast.error("Please select a date");
                      return;
                    }
                    setIsSavingEdit(true);
                    try {
                      const res = await fetch(`/api/admin/bookings/${bookingId}/update-date`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ moveDate: editMoveDate, moveTime: editMoveTime, notify: true }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Move date updated & customer notified!");
                        setEditDateModalOpen(false);
                        refresh();
                      } else {
                        toast.error(data.error || "Failed to update date");
                      }
                    } catch {
                      toast.error("Failed to update date");
                    } finally {
                      setIsSavingEdit(false);
                    }
                  }}
                  disabled={isSavingEdit}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-purple-700 px-4 py-2.5 font-medium text-white hover:bg-brand-purple-800 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Notifying...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Save & Notify
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {editAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Edit Addresses</h3>
              <button onClick={() => setEditAddressModalOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-6">Update origin or destination addresses. Customer will be notified of changes.</p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Origin Address */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Origin Address</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    defaultValue={originAddress?.line_1 || ""}
                    id="origin-line1"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    defaultValue={originAddress?.line_2 || ""}
                    id="origin-line2"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    defaultValue={originAddress?.city || ""}
                    id="origin-city"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Postcode *</label>
                  <input
                    type="text"
                    defaultValue={originAddress?.postcode || ""}
                    id="origin-postcode"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Destination Address */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Destination Address</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    defaultValue={destinationAddress?.line_1 || ""}
                    id="dest-line1"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    defaultValue={destinationAddress?.line_2 || ""}
                    id="dest-line2"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    defaultValue={destinationAddress?.city || ""}
                    id="dest-city"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Postcode *</label>
                  <input
                    type="text"
                    defaultValue={destinationAddress?.postcode || ""}
                    id="dest-postcode"
                    className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditAddressModalOpen(false)}
                className="rounded-xl border-2 border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const originLine1 = (document.getElementById("origin-line1") as HTMLInputElement).value;
                  const originPostcode = (document.getElementById("origin-postcode") as HTMLInputElement).value;
                  const destLine1 = (document.getElementById("dest-line1") as HTMLInputElement).value;
                  const destPostcode = (document.getElementById("dest-postcode") as HTMLInputElement).value;

                  if (!originLine1 || !originPostcode || !destLine1 || !destPostcode) {
                    toast.error("Please fill in all required fields");
                    return;
                  }

                  setIsSavingEdit(true);
                  try {
                    const res = await fetch(`/api/admin/bookings/${bookingId}/update-addresses`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        notify: false,
                        origin: {
                          line_1: originLine1,
                          line_2: (document.getElementById("origin-line2") as HTMLInputElement).value,
                          city: (document.getElementById("origin-city") as HTMLInputElement).value,
                          postcode: originPostcode,
                        },
                        destination: {
                          line_1: destLine1,
                          line_2: (document.getElementById("dest-line2") as HTMLInputElement).value,
                          city: (document.getElementById("dest-city") as HTMLInputElement).value,
                          postcode: destPostcode,
                        },
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Addresses updated (customer not notified)");
                      setEditAddressModalOpen(false);
                      refresh();
                    } else {
                      toast.error(data.error || "Failed to update addresses");
                    }
                  } catch {
                    toast.error("Failed to update addresses");
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}
                disabled={isSavingEdit}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Only
                  </>
                )}
              </button>
              <button
                onClick={async () => {
                  const originLine1 = (document.getElementById("origin-line1") as HTMLInputElement).value;
                  const originPostcode = (document.getElementById("origin-postcode") as HTMLInputElement).value;
                  const destLine1 = (document.getElementById("dest-line1") as HTMLInputElement).value;
                  const destPostcode = (document.getElementById("dest-postcode") as HTMLInputElement).value;

                  if (!originLine1 || !originPostcode || !destLine1 || !destPostcode) {
                    toast.error("Please fill in all required fields");
                    return;
                  }

                  setIsSavingEdit(true);
                  try {
                    const res = await fetch(`/api/admin/bookings/${bookingId}/update-addresses`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        notify: true,
                        origin: {
                          line_1: originLine1,
                          line_2: (document.getElementById("origin-line2") as HTMLInputElement).value,
                          city: (document.getElementById("origin-city") as HTMLInputElement).value,
                          postcode: originPostcode,
                        },
                        destination: {
                          line_1: destLine1,
                          line_2: (document.getElementById("dest-line2") as HTMLInputElement).value,
                          city: (document.getElementById("dest-city") as HTMLInputElement).value,
                          postcode: destPostcode,
                        },
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Addresses updated & customer notified!");
                      setEditAddressModalOpen(false);
                      refresh();
                    } else {
                      toast.error(data.error || "Failed to update addresses");
                    }
                  } catch {
                    toast.error("Failed to update addresses");
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}
                disabled={isSavingEdit}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-purple-700 px-4 py-2.5 font-medium text-white hover:bg-brand-purple-800 disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Notifying...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Save & Notify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
