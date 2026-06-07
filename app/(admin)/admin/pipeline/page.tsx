"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ServiceBadge } from "@/components/admin/ServiceBadge";
import { Skeleton } from "@/components/admin/AdminSkeleton";
import { STATUS_DOT_COLOURS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { BookingStatus, ServiceType } from "@/types";

interface KanbanBooking {
  id: string; reference: string; service_type: ServiceType;
  status: BookingStatus; move_date: string | null; is_flexible_date: boolean;
  created_at: string; customer_name: string; origin_postcode: string;
  destination_postcode: string | null;
}

// Column definitions — status group → canonical status for drops
const COLUMNS: { id: string; label: string; statuses: BookingStatus[]; dropStatus: BookingStatus; colour: string }[] = [
  { id: "inquiry", label: "New Inquiries", statuses: ["inquiry"], dropStatus: "inquiry", colour: "bg-slate-100" },
  { id: "contacted", label: "Contacted", statuses: ["called", "not_called", "answered", "not_answered"], dropStatus: "called", colour: "bg-blue-50" },
  { id: "in_progress", label: "In Progress", statuses: ["processing", "pending"], dropStatus: "processing", colour: "bg-indigo-50" },
  { id: "invoice_sent", label: "Invoice Sent", statuses: ["deposit_invoice_sent", "full_invoice_sent"], dropStatus: "deposit_invoice_sent", colour: "bg-violet-50" },
  { id: "confirmed", label: "Confirmed", statuses: ["deposit_paid_job_confirmed", "full_balance_paid"], dropStatus: "deposit_paid_job_confirmed", colour: "bg-green-50" },
  { id: "completed", label: "Completed", statuses: ["job_completed"], dropStatus: "job_completed", colour: "bg-emerald-50" },
  { id: "dead", label: "Dead Leads", statuses: ["bad_lead", "not_a_good_fit"], dropStatus: "bad_lead", colour: "bg-red-50" },
];

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Booking Card ─────────────────────────────────────────────────────────

function BookingCard({ booking, isDragging = false }: { booking: KanbanBooking; isDragging?: boolean }) {
  const router = useRouter();
  const initials = booking.customer_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className={`rounded-xl border bg-white p-3.5 shadow-sm transition-all ${isDragging ? "rotate-2 shadow-xl border-purple-300 opacity-95 cursor-grabbing" : "border-slate-100 hover:border-purple-200 hover:shadow-md cursor-grab"}`}
      onClick={() => !isDragging && router.push(`/admin/bookings/${booking.id}`)}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <ServiceBadge service={booking.service_type} />
        <span className="font-mono text-[10px] font-semibold text-slate-400">{booking.reference}</span>
      </div>
      <p className="font-semibold text-sm text-slate-900 truncate">{booking.customer_name}</p>
      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <span className="truncate">{booking.origin_postcode}</span>
        {booking.destination_postcode && <><span>→</span><span className="truncate">{booking.destination_postcode}</span></>}
      </div>
      {booking.move_date && (
        <div className="mt-2 flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600">
          📅 {booking.is_flexible_date ? "Flexible" : formatDate(booking.move_date)}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{relTime(booking.created_at)}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-700 text-[10px] font-bold text-white">
          {initials}
        </span>
      </div>
    </div>
  );
}

// ── Draggable wrapper ────────────────────────────────────────────────────

function DraggableCard({ booking }: { booking: KanbanBooking }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: booking.id, data: { booking } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <BookingCard booking={booking} />
    </div>
  );
}

// ── Droppable column ─────────────────────────────────────────────────────

function KanbanColumn({
  column, bookings, isLoading,
}: {
  column: typeof COLUMNS[0];
  bookings: KanbanBooking[];
  isLoading: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const dotColour = STATUS_DOT_COLOURS[column.dropStatus] ?? "bg-slate-400";

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColour}`} />
        <span className="font-semibold text-sm text-slate-800 flex-1">{column.label}</span>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{bookings.length}</span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-24 space-y-2.5 p-3 transition-colors ${isOver ? "bg-purple-50/70" : ""}`}
      >
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : bookings.length === 0 ? (
          <div className={`flex h-16 items-center justify-center rounded-xl border-2 border-dashed ${isOver ? "border-purple-400" : "border-slate-200"}`}>
            <p className="text-xs text-slate-400">Drop here</p>
          </div>
        ) : (
          bookings.map(b => <DraggableCard key={b.id} booking={b} />)
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [bookings, setBookings] = useState<KanbanBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState<KanbanBooking | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select("id,reference,service_type,status,move_date,is_flexible_date,created_at,customers!inner(full_name),origin_addr:addresses!origin_address_id(postcode),dest_addr:addresses!destination_address_id(postcode)")
      .order("created_at", { ascending: false })
      .limit(200);

    setBookings((data ?? []).map((b: Record<string, unknown>) => ({
      id: b.id as string, reference: b.reference as string,
      service_type: b.service_type as ServiceType, status: b.status as BookingStatus,
      move_date: b.move_date as string | null, is_flexible_date: b.is_flexible_date as boolean,
      created_at: b.created_at as string,
      customer_name: (b.customers as { full_name: string } | null)?.full_name ?? "—",
      origin_postcode: (b.origin_addr as { postcode: string } | null)?.postcode ?? "—",
      destination_postcode: (b.dest_addr as { postcode: string } | null)?.postcode ?? null,
    })));
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("pipeline-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const handleDragStart = (event: DragStartEvent) => {
    const b = event.active.data.current?.booking as KanbanBooking;
    setActiveBooking(b ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBooking(null);
    const { active, over } = event;
    if (!over) return;

    const booking = active.data.current?.booking as KanbanBooking;
    const targetColumn = COLUMNS.find(c => c.id === over.id);
    if (!targetColumn || booking.status === targetColumn.dropStatus) return;

    const prevStatus = booking.status;
    const newStatus = targetColumn.dropStatus;

    // Optimistic update
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));

    const res = await fetch(`/api/admin/bookings/${booking.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json() as { success: boolean };

    if (!json.success) {
      // Revert
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: prevStatus } : b));
      toast.error("Failed to update status");
    } else {
      // Flash green on the card
      toast.success(`Moved to ${targetColumn.label}`);
    }
  };

  const getColumnBookings = (col: typeof COLUMNS[0]) =>
    bookings.filter(b => col.statuses.includes(b.status));

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col overflow-hidden">
      <div className="mb-5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Pipeline</h2>
          <p className="text-sm text-slate-500">{bookings.length} total bookings across all stages</p>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              bookings={getColumnBookings(col)}
              isLoading={isLoading}
            />
          ))}
        </div>

        <DragOverlay>
          {activeBooking && <BookingCard booking={activeBooking} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
