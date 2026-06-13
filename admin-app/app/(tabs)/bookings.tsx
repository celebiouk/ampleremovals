import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, RefreshControl, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Input, Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { BookingCard } from "@/components/booking/BookingCard";
import { useBookings, type BookingRow } from "@/hooks/useBookings";
import { subscribeToBookings, unsubscribe } from "@/lib/realtime";
import { STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/types";

const STATUS_FILTERS: { label: string; value: BookingStatus | "" }[] = [
  { label: "All Status", value: "" },
  { label: "Inquiry", value: "inquiry" },
  { label: "Pending", value: "pending" },
  { label: STATUS_LABELS.deposit_invoice_sent, value: "deposit_invoice_sent" },
  { label: "Confirmed", value: "deposit_paid_job_confirmed" },
  { label: STATUS_LABELS.full_invoice_sent, value: "full_invoice_sent" },
  { label: "Completed", value: "job_completed" },
];

const SERVICE_FILTERS: { label: string; value: string }[] = [
  { label: "All Services", value: "" },
  { label: "Removals", value: "removals" },
  { label: "Man & Van", value: "man_and_van" },
  { label: "House Clearance", value: "house_clearance" },
  { label: "Cleaning", value: "house_cleaning" },
  { label: "End of Tenancy", value: "end_of_tenancy_cleaning" },
];

export default function BookingsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [service, setService] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const { data, isLoading, isError, refetch, isRefetching } = useBookings({ search, status, service });
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = subscribeToBookings(() => refetch());
    return () => {
      unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [refetch]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    Haptics.selectionAsync().catch(() => {});
  };

  const deleteBooking = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete booking");
    } finally {
      setDeleting(null);
    }
  };

  const bulkUpdateStatus = async (newStatus: BookingStatus) => {
    if (selected.size === 0) return;
    try {
      const response = await fetch("/api/admin/bookings/bulk/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          status: newStatus,
        }),
      });
      if (!response.ok) throw new Error("Failed to update");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSelected(new Set());
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update bookings");
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: BookingRow }) => {
      const isSelected = selected.has(item.id);
      return (
        <Pressable
          onLongPress={() => toggleSelect(item.id)}
          onPress={() => !selected.size && router.push(`/booking/${item.id}`)}
        >
          <View className={`relative ${isSelected ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
            {isSelected && (
              <Pressable
                onPress={() => deleteBooking(item.id)}
                disabled={deleting === item.id}
                className="absolute right-4 top-4 z-10 p-2"
              >
                <Trash2 size={18} color="#ef4444" />
              </Pressable>
            )}
            <BookingCard booking={item} onPress={() => !selected.size && router.push(`/booking/${item.id}`)} />
          </View>
        </Pressable>
      );
    },
    [selected, router, deleting]
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <LargeHeader title="Bookings" />
      <View className="border-b border-slate-100 px-5 pb-3 dark:border-slate-800">
        <View className="relative">
          <View className="absolute left-3 top-3.5 z-10">
            <Search size={18} color="#94a3b8" />
          </View>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, reference, postcode"
            autoCapitalize="none"
            className="pl-10"
          />
        </View>
        <Text className="mt-3 text-xs font-semibold text-slate-600 px-0.5">Status</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-1.5"
          contentContainerClassName="gap-2 pr-4"
        >
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setStatus(f.value as BookingStatus | "");
                }}
                className={`rounded-full px-3.5 py-1.5 ${
                  active ? "bg-brand-purple-800" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? "text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className="mt-3 text-xs font-semibold text-slate-600 px-0.5">Service</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-1.5"
          contentContainerClassName="gap-2 pr-4"
        >
          {SERVICE_FILTERS.map((f) => {
            const active = service === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setService(f.value);
                }}
                className={`rounded-full px-3.5 py-1.5 ${
                  active ? "bg-green-600" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? "text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </View>
      ) : isError ? (
        <ErrorState message="Couldn't load bookings." onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(b) => b.id}
          renderItem={renderItem}
          contentContainerClassName="p-5 gap-3"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState title="No bookings" message="Nothing matches your search or filter." />
          }
        />
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <View className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <View className="flex-row items-center justify-between gap-3 mb-3">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {selected.size} selected
            </Text>
            <Pressable onPress={() => setSelected(new Set())} className="px-3 py-1">
              <Text className="text-sm text-slate-500">Clear</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {STATUS_FILTERS.filter(s => s.value).map((s) => (
              <Pressable
                key={s.value}
                onPress={() => bulkUpdateStatus(s.value as BookingStatus)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                <Text className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}
