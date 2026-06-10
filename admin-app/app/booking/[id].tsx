/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  ScrollView, View, Text, Pressable, Modal, Alert, RefreshControl, Linking, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft, Phone, Mail, MapPin, Navigation, Calendar, ChevronDown, X, Pencil, Receipt,
} from "lucide-react-native";
import { Card, Button, Input, StatusBadge, ServiceBadge, Skeleton, ErrorState } from "@/components/ui";
import { useBookingDetail } from "@/hooks/useBookingDetail";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, toDateKey } from "@/lib/utils";
import { STATUS_LABELS, ALL_STATUSES } from "@/lib/constants";
import type { Address, BookingStatus } from "@/types";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useBookingDetail(id!);

  const [statusModal, setStatusModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [busy, setBusy] = useState(false);

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

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

  const { booking, customer, origin, destination, invoices, statusHistory } = data;

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
          <View className="mt-3">
            <Button
              label="Reschedule date"
              variant="outline"
              size="sm"
              onPress={() => setShowDate(true)}
              disabled={busy}
            />
          </View>
        </Card>

        {/* Customer */}
        {customer ? (
          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Customer</Text>
            <Text className="font-medium text-slate-900 dark:text-white">{customer.full_name}</Text>
            <View className="mt-3 flex-row gap-2">
              {customer.phone ? (
                <Button
                  label="Call"
                  variant="outline"
                  size="sm"
                  onPress={() => Linking.openURL(`tel:${customer.phone}`)}
                />
              ) : null}
              {customer.email ? (
                <Button
                  label="Email"
                  variant="outline"
                  size="sm"
                  onPress={() => Linking.openURL(`mailto:${customer.email}`)}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

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

      {/* Date picker */}
      {showDate ? (
        <DateTimePicker
          value={booking.move_date ? new Date(booking.move_date) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selected) => {
            setShowDate(false);
            if (event.type === "set" && selected) reschedule(selected);
          }}
        />
      ) : null}

      {/* Address edit modal */}
      <AddressEditModal
        visible={addressModal}
        origin={origin}
        destination={destination}
        onClose={() => setAddressModal(false)}
        onSaved={() => { setAddressModal(false); invalidateAll(); }}
        bookingId={id!}
      />
    </Shell>
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
