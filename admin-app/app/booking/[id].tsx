/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import {
  ScrollView, View, Text, Pressable, Modal, Alert, RefreshControl, Linking, Platform, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  ArrowLeft, Phone, Mail, MapPin, Navigation, Calendar, ChevronDown, X, Pencil, Receipt,
  MessageCirclePlus, BellPlus, CheckCircle2, FileText, MessageSquare,
} from "lucide-react-native";
import { Card, Button, Input, StatusBadge, ServiceBadge, Skeleton, ErrorState } from "@/components/ui";
import { MessageComposer } from "@/components/booking/MessageComposer";
import { NotesSection } from "@/components/booking/NotesSection";
import { DriverStatusBar } from "@/components/booking/DriverStatusBar";
import { AssignedDriversSection } from "@/components/booking/AssignedDriversSection";
import { QuoteSheet } from "@/components/booking/QuoteSheet";
import { GenerateInvoiceSheet } from "@/components/booking/GenerateInvoiceSheet";
import { colors } from "@/lib/colors";
import { useBookingDetail } from "@/hooks/useBookingDetail";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { subscribeToBookingActivity, subscribeToBookingNotes, unsubscribe } from "@/lib/realtime";
import { formatCurrency, formatDate, formatDateTime, toDateKey } from "@/lib/utils";
import { STATUS_LABELS, ALL_STATUSES, SERVICE_LABELS_SHORT } from "@/lib/constants";
import type { Address, BookingStatus } from "@/types";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useBookingDetail(id!);

  const [statusModal, setStatusModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [messageOpen, setMessageOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["invoices"] });
  }

  // Live: refetch when this booking's notes or activity change.
  useEffect(() => {
    if (!id) return;
    const chans: RealtimeChannel[] = [
      subscribeToBookingActivity(id, () => qc.invalidateQueries({ queryKey: ["booking", id] })),
      subscribeToBookingNotes(id, () => qc.invalidateQueries({ queryKey: ["booking", id] })),
    ];
    return () => chans.forEach(unsubscribe);
  }, [id, qc]);

  async function changeStatus(status: BookingStatus) {
    setStatusModal(false);
    setBusy(true);
    try {
      await apiFetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      invalidateAll();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  async function reschedule(date: Date) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/bookings/${id}/update-date`, {
        method: "POST",
        body: JSON.stringify({ moveDate: toDateKey(date), notify: true }),
      });
      invalidateAll();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to reschedule");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <Shell onBack={() => router.back()} title="Booking">
        <View className="gap-4 p-5">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </View>
      </Shell>
    );
  }
  if (isError || !data) {
    return (
      <Shell onBack={() => router.back()} title="Booking">
        <ErrorState message="Couldn't load this booking." onRetry={refetch} />
      </Shell>
    );
  }

  const { booking, customer, origin, destination, invoices, statusHistory, notes, activity, reminders } = data;

  const templateVars = {
    name: customer?.full_name?.split(" ")[0] ?? "there",
    service: SERVICE_LABELS_SHORT[booking.service_type] ?? booking.service_type,
    ref: booking.reference,
    date: booking.move_date ? formatDate(booking.move_date) : "TBC",
    origin: origin ? [origin.line_1, origin.postcode].filter(Boolean).join(", ") : "",
  };

  async function completeReminder(reminderId: string) {
    try {
      await apiFetch(`/api/admin/call-back-reminders/${reminderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
      qc.invalidateQueries({ queryKey: ["booking", id] });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update reminder");
    }
  }

  return (
    <Shell onBack={() => router.back()} title={booking.reference}>
      <ScrollView
        contentContainerClassName="p-5 gap-4 pb-12"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Summary */}
        <View className="rounded-2xl bg-brand-purple-800 p-5">
          <View className="mb-2 flex-row flex-wrap gap-2">
            <ServiceBadge service={booking.service_type} />
          </View>
          <Text className="text-2xl font-bold text-white">{customer?.full_name ?? "—"}</Text>
          <Text className="font-mono text-sm text-purple-200">{booking.reference}</Text>
          {booking.move_date ? (
            <View className="mt-3 flex-row items-center gap-2">
              <Calendar size={16} color="#e9d5ff" />
              <Text className="text-purple-100">{formatDate(booking.move_date)}</Text>
            </View>
          ) : null}
        </View>

        {/* Quick actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
          <QuickAction icon={<FileText size={16} color={colors.primary.DEFAULT} />} label="Create Quote" onPress={() => setQuoteOpen(true)} />
          <QuickAction icon={<Receipt size={16} color={colors.primary.DEFAULT} />} label="Generate Invoice" onPress={() => setInvoiceOpen(true)} />
          <QuickAction icon={<MessageSquare size={16} color={colors.primary.DEFAULT} />} label="Message" onPress={() => setMessageOpen(true)} />
        </ScrollView>

        {/* Status */}
        <Card>
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Status</Text>
          <View className="mb-3"><StatusBadge status={booking.status} /></View>
          <Pressable
            onPress={() => setStatusModal(true)}
            disabled={busy}
            className="flex-row items-center justify-between rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700"
          >
            <Text className="text-slate-700 dark:text-slate-200">Change status</Text>
            <ChevronDown size={18} color="#94a3b8" />
          </Pressable>
        </Card>

        {/* Move date */}
        <Card>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Move date</Text>
            <Pressable
              onPress={() => {
                setPendingDate(booking.move_date ? new Date(booking.move_date) : new Date());
                setShowDate(true);
              }}
              disabled={busy}
              className="flex-row items-center gap-1"
            >
              <Pencil size={14} color="#7e22ce" />
              <Text className="text-sm font-medium text-brand-purple-700">Edit</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2">
            <Calendar size={18} color="#7e22ce" />
            <Text className="text-base font-medium text-slate-900 dark:text-white">
              {booking.move_date ? formatDate(booking.move_date) : "Not set yet"}
            </Text>
          </View>
        </Card>

        {/* Customer */}
        {customer ? (
          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Customer</Text>
            <Text className="font-medium text-slate-900 dark:text-white">{customer.full_name}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {customer.phone ? (
                <Button label="Call" variant="outline" size="sm" onPress={() => Linking.openURL(`tel:${customer.phone}`)} />
              ) : null}
              {customer.email ? (
                <Button label="Email" variant="outline" size="sm" onPress={() => Linking.openURL(`mailto:${customer.email}`)} />
              ) : null}
            </View>
            <View className="mt-2">
              <Button label="Message customer" variant="secondary" size="sm" onPress={() => setMessageOpen(true)} />
            </View>
          </Card>
        ) : null}

        {/* Assigned drivers */}
        <AssignedDriversSection bookingId={id!} />

        {/* Driver status push */}
        <DriverStatusBar bookingId={id!} />

        {/* Addresses */}
        <Card>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Addresses</Text>
            <Pressable onPress={() => setAddressModal(true)} className="flex-row items-center gap-1">
              <Pencil size={14} color="#7e22ce" />
              <Text className="text-sm font-medium text-brand-purple-700">Edit</Text>
            </Pressable>
          </View>
          <AddressBlock label="PICK UP" addr={origin} colour="#7e22ce" />
          {destination ? (
            <View className="mt-4">
              <AddressBlock label="DROP OFF" addr={destination} colour="#16a34a" />
            </View>
          ) : null}
        </Card>

        {/* Money */}
        <Card>
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Financials</Text>
          {booking.quote_total != null ? (
            <Row label="Quote total" value={formatCurrency(booking.quote_total)} />
          ) : null}
          {invoices.length === 0 ? (
            <Text className="mt-2 text-sm text-slate-500">No invoices yet.</Text>
          ) : (
            invoices.map((inv) => (
              <View key={inv.id} className="mt-2 flex-row items-center gap-2">
                <Receipt size={16} color="#94a3b8" />
                <Text className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                  {inv.invoice_number} · {inv.status}
                </Text>
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(inv.total)}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Notes */}
        <NotesSection
          bookingId={id!}
          notes={notes}
          onChanged={() => qc.invalidateQueries({ queryKey: ["booking", id] })}
        />

        {/* Call-back reminders */}
        <Card>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Call-back reminders</Text>
            <Pressable onPress={() => setReminderOpen(true)} className="flex-row items-center gap-1">
              <BellPlus size={16} color="#7e22ce" />
              <Text className="text-sm font-medium text-brand-purple-700">Set</Text>
            </Pressable>
          </View>
          {reminders.length === 0 ? (
            <Text className="text-sm text-slate-500">No reminders.</Text>
          ) : (
            <View className="gap-2">
              {reminders.map((r) => (
                <View key={r.id} className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatDateTime(r.reminder_datetime)}
                    </Text>
                    {r.reason ? <Text className="text-xs text-slate-500">{r.reason}</Text> : null}
                    <Text className="mt-0.5 text-xs capitalize text-slate-400">{r.status}</Text>
                  </View>
                  {r.status === "pending" ? (
                    <Pressable onPress={() => completeReminder(r.id)} hitSlop={8}>
                      <CheckCircle2 size={22} color="#16a34a" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Activity timeline */}
        <Card>
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Activity</Text>
          {activity.length === 0 ? (
            <Text className="text-sm text-slate-500">No activity yet.</Text>
          ) : (
            <View className="gap-3">
              {activity.map((a) => (
                <View key={a.id} className="flex-row gap-3">
                  <View className="mt-1.5 h-2 w-2 rounded-full bg-slate-400" />
                  <View className="flex-1">
                    <Text className="text-sm text-slate-800 dark:text-slate-200">{a.action}</Text>
                    <Text className="text-xs text-slate-400">
                      {a.performed_by ?? "system"} · {formatDateTime(a.created_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* History */}
        <Card>
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            Status history
          </Text>
          {statusHistory.length === 0 ? (
            <Text className="text-sm text-slate-500">No changes yet.</Text>
          ) : (
            <View className="gap-3">
              {statusHistory.map((h) => (
                <View key={h.id} className="flex-row gap-3">
                  <View className="mt-1.5 h-2 w-2 rounded-full bg-brand-purple-600" />
                  <View className="flex-1">
                    <Text className="text-sm text-slate-800 dark:text-slate-200">
                      {STATUS_LABELS[h.new_status as BookingStatus] ?? h.new_status}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      {h.changed_by ?? "system"} · {formatDateTime(h.changed_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Status picker modal */}
      <Modal visible={statusModal} animationType="slide" transparent onRequestClose={() => setStatusModal(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setStatusModal(false)}>
          <Pressable className="max-h-[70%] rounded-t-3xl bg-white dark:bg-slate-900" onPress={() => {}}>
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Change status</Text>
              <Pressable onPress={() => setStatusModal(false)}><X size={22} color="#94a3b8" /></Pressable>
            </View>
            <ScrollView contentContainerClassName="p-3">
              {ALL_STATUSES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => changeStatus(s)}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${
                    s === booking.status ? "bg-brand-purple-50 dark:bg-brand-purple-800/20" : ""
                  }`}
                >
                  <Text className="text-base text-slate-800 dark:text-slate-100">{STATUS_LABELS[s]}</Text>
                  {s === booking.status ? (
                    <Text className="text-xs font-semibold text-brand-purple-700">Current</Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date picker — Android shows a native dialog directly */}
      {showDate && Platform.OS === "android" ? (
        <DateTimePicker
          value={pendingDate}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowDate(false);
            if (event.type === "set" && selected) reschedule(selected);
          }}
        />
      ) : null}

      {/* Date picker — iOS needs the inline calendar inside a visible modal */}
      <Modal visible={showDate && Platform.OS === "ios"} transparent animationType="fade" onRequestClose={() => setShowDate(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowDate(false)}>
          <Pressable className="rounded-t-3xl bg-white p-5" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-2 font-display text-xl text-slate-900">Reschedule date</Text>
            <DateTimePicker
              value={pendingDate}
              mode="date"
              display="inline"
              onChange={(_e, selected) => { if (selected) setPendingDate(selected); }}
            />
            <View className="mt-2 flex-row gap-3">
              <View className="flex-1">
                <Button label="Cancel" variant="outline" onPress={() => setShowDate(false)} disabled={busy} />
              </View>
              <View className="flex-1">
                <Button label="Confirm date" onPress={() => { setShowDate(false); reschedule(pendingDate); }} loading={busy} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Address edit modal */}
      <AddressEditModal
        visible={addressModal}
        origin={origin}
        destination={destination}
        onClose={() => setAddressModal(false)}
        onSaved={() => { setAddressModal(false); invalidateAll(); }}
        bookingId={id!}
      />

      {/* Message composer */}
      <MessageComposer
        visible={messageOpen}
        bookingId={id!}
        vars={templateVars}
        onClose={() => setMessageOpen(false)}
        onSent={() => { setMessageOpen(false); invalidateAll(); Alert.alert("Sent", "Message sent to the customer."); }}
      />

      {/* Reminder modal */}
      <ReminderModal
        visible={reminderOpen}
        bookingId={id!}
        customerId={customer?.id ?? null}
        onClose={() => setReminderOpen(false)}
        onSaved={() => { setReminderOpen(false); invalidateAll(); }}
      />

      <QuoteSheet
        visible={quoteOpen}
        bookingId={id!}
        onClose={() => setQuoteOpen(false)}
        onDone={() => { setQuoteOpen(false); invalidateAll(); }}
      />

      <GenerateInvoiceSheet
        visible={invoiceOpen}
        bookingId={id!}
        onClose={() => setInvoiceOpen(false)}
        onDone={() => { setInvoiceOpen(false); invalidateAll(); }}
      />
    </Shell>
  );
}

function QuickAction({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-2 rounded-full border border-brand-purple-200 bg-brand-purple-50 px-4 py-2.5"
    >
      {icon}
      <Text className="font-semibold text-sm text-brand-purple-800">{label}</Text>
    </Pressable>
  );
}

function ReminderModal({
  visible, bookingId, customerId, onClose, onSaved,
}: {
  visible: boolean;
  bookingId: string;
  customerId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState("");
  const [when, setWhen] = useState(() => new Date(Date.now() + 24 * 3600 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setReason("");
      setWhen(new Date(Date.now() + 24 * 3600 * 1000));
    }
  }, [visible]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/admin/call-back-reminders", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          customerId,
          reminderDatetime: when.toISOString(),
          reason: reason.trim() || "Call back",
          notes: null,
        }),
      });
      onSaved();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to set reminder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Set call-back</Text>
          <Pressable onPress={onClose}><X size={24} color="#94a3b8" /></Pressable>
        </View>
        <ScrollView contentContainerClassName="p-4 gap-4">
          <Input label="Reason" value={reason} onChangeText={setReason} placeholder="e.g. Discuss quote" />
          <View>
            <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">When</Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              className="flex-row items-center justify-between rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700"
            >
              <Text className="text-slate-800 dark:text-slate-200">{formatDateTime(when.toISOString())}</Text>
              <Calendar size={18} color="#94a3b8" />
            </Pressable>
          </View>
          {showPicker ? (
            <DateTimePicker
              value={when}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(e, sel) => {
                setShowPicker(false);
                if (e.type === "set" && sel) setWhen(sel);
              }}
            />
          ) : null}
          <Button label="Set reminder" onPress={save} loading={saving} size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Shell({ children, title, onBack }: { children: React.ReactNode; title: string; onBack: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={onBack} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-mono text-base font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {children}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className="text-sm font-semibold text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}

function AddressBlock({ label, addr, colour }: { label: string; addr: Address | null; colour: string }) {
  if (!addr) return <Text className="text-sm text-slate-500">No {label.toLowerCase()} address.</Text>;
  const full = [addr.line_1, addr.line_2, addr.city, addr.postcode].filter(Boolean).join(", ");
  return (
    <View>
      <View className="mb-1 flex-row items-center gap-2">
        <MapPin size={16} color={colour} />
        <Text className="text-xs font-semibold" style={{ color: colour }}>{label}</Text>
      </View>
      <Text className="text-slate-700 dark:text-slate-200">{full}</Text>
      <Pressable
        onPress={() =>
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr.postcode)}`)
        }
        className="mt-2 flex-row items-center gap-1.5 self-start rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800"
      >
        <Navigation size={14} color="#7e22ce" />
        <Text className="text-sm font-medium text-brand-purple-700">Directions</Text>
      </Pressable>
    </View>
  );
}

function AddressEditModal({
  visible, origin, destination, bookingId, onClose, onSaved,
}: {
  visible: boolean;
  origin: Address | null;
  destination: Address | null;
  bookingId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [o, setO] = useState({ line_1: "", line_2: "", city: "", postcode: "" });
  const [d, setD] = useState({ line_1: "", line_2: "", city: "", postcode: "" });
  const [saving, setSaving] = useState(false);

  // Seed the form whenever the modal opens.
  useEffect(() => {
    if (visible) {
      setO({ line_1: origin?.line_1 ?? "", line_2: origin?.line_2 ?? "", city: origin?.city ?? "", postcode: origin?.postcode ?? "" });
      setD({ line_1: destination?.line_1 ?? "", line_2: destination?.line_2 ?? "", city: destination?.city ?? "", postcode: destination?.postcode ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/bookings/${bookingId}/update-addresses`, {
        method: "POST",
        body: JSON.stringify({ origin: o, destination: d, notify: false }),
      });
      onSaved();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save addresses");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Edit Addresses</Text>
          <Pressable onPress={onClose}><X size={24} color="#94a3b8" /></Pressable>
        </View>
        <ScrollView contentContainerClassName="p-4 gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pick up</Text>
          <Input label="Address line 1" value={o.line_1} onChangeText={(v) => setO({ ...o, line_1: v })} />
          <Input label="Address line 2" value={o.line_2} onChangeText={(v) => setO({ ...o, line_2: v })} />
          <Input label="City" value={o.city} onChangeText={(v) => setO({ ...o, city: v })} />
          <Input label="Postcode" value={o.postcode} onChangeText={(v) => setO({ ...o, postcode: v })} autoCapitalize="characters" />

          <Text className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Drop off</Text>
          <Input label="Address line 1" value={d.line_1} onChangeText={(v) => setD({ ...d, line_1: v })} />
          <Input label="Address line 2" value={d.line_2} onChangeText={(v) => setD({ ...d, line_2: v })} />
          <Input label="City" value={d.city} onChangeText={(v) => setD({ ...d, city: v })} />
          <Input label="Postcode" value={d.postcode} onChangeText={(v) => setD({ ...d, postcode: v })} autoCapitalize="characters" />

          <Button label="Save addresses" onPress={save} loading={saving} size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
