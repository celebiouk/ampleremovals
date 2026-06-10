import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { X, MoveRight } from "lucide-react-native";
import { Skeleton, ErrorState, ServiceBadge } from "@/components/ui";
import { useBookings, type BookingRow } from "@/hooks/useBookings";
import { apiFetch } from "@/lib/api";
import { subscribeToBookings, unsubscribe } from "@/lib/realtime";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { STATUS_LABELS, ALL_STATUSES, STATUS_ROW } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";

// Visualisation columns (bookings are bucketed; moving sets an exact status).
const COLUMNS: { key: string; label: string; statuses: BookingStatus[] }[] = [
  { key: "new", label: "New", statuses: ["inquiry"] },
  { key: "contacted", label: "Contacted", statuses: ["called", "not_called", "answered", "not_answered"] },
  { key: "quoting", label: "Quoting", statuses: ["processing", "pending", "deposit_invoice_sent"] },
  { key: "confirmed", label: "Confirmed", statuses: ["deposit_paid_job_confirmed"] },
  { key: "invoiced", label: "Invoiced", statuses: ["full_invoice_sent", "full_balance_paid"] },
  { key: "completed", label: "Completed", statuses: ["job_completed"] },
  { key: "lost", label: "Lost", statuses: ["bad_lead", "not_a_good_fit"] },
];

const COLUMN_W = 280;

export default function PipelineScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useBookings({ search: "", status: "" });
  const [moveTarget, setMoveTarget] = useState<BookingRow | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = subscribeToBookings(() => refetch());
    return () => { unsubscribe(channelRef.current); channelRef.current = null; };
  }, [refetch]);

  const grouped = useMemo(() => {
    const map: Record<string, BookingRow[]> = {};
    COLUMNS.forEach((c) => (map[c.key] = []));
    (data ?? []).forEach((b) => {
      const col = COLUMNS.find((c) => c.statuses.includes(b.status));
      if (col) map[col.key].push(b);
    });
    return map;
  }, [data]);

  async function move(status: BookingStatus) {
    const b = moveTarget;
    setMoveTarget(null);
    if (!b) return;
    try {
      await apiFetch(`/api/admin/bookings/${b.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to move");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <LargeHeader title="Pipeline" subtitle="Swipe columns · tap to open · move to change stage" />

      {isLoading ? (
        <View className="flex-row gap-3 p-5">
          <Skeleton className="h-96 w-64" />
          <Skeleton className="h-96 w-64" />
        </View>
      ) : isError ? (
        <ErrorState message="Couldn't load the pipeline." onRetry={refetch} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="p-4 gap-3"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {COLUMNS.map((col) => {
            const items = grouped[col.key] ?? [];
            return (
              <View key={col.key} style={{ width: COLUMN_W }} className="rounded-2xl bg-slate-100 p-2 dark:bg-slate-900">
                <View className="flex-row items-center justify-between px-2 py-2">
                  <Text className="font-semibold text-slate-900 dark:text-white">{col.label}</Text>
                  <View className="rounded-full bg-white px-2 py-0.5 dark:bg-slate-800">
                    <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">{items.length}</Text>
                  </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-2 pb-2">
                  {items.length === 0 ? (
                    <Text className="px-2 py-6 text-center text-xs text-slate-400">Empty</Text>
                  ) : (
                    items.map((b) => (
                      <View key={b.id} className={cn("rounded-xl border border-slate-200 p-3", STATUS_ROW[b.status])}>
                        <Pressable onPress={() => router.push(`/booking/${b.id}`)}>
                          <View className="mb-1.5"><ServiceBadge service={b.service_type} /></View>
                          <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                            {b.customer_name}
                          </Text>
                          <Text className="font-mono text-xs font-bold text-slate-500">{b.reference}</Text>
                          <Text className="mt-1 text-sm font-semibold text-slate-700" numberOfLines={1}>
                            {b.origin_postcode}{b.destination_postcode ? ` → ${b.destination_postcode}` : ""}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setMoveTarget(b)}
                          className="mt-2 flex-row items-center justify-center gap-1 rounded-lg bg-white/70 py-2"
                        >
                          <MoveRight size={16} color="#7e22ce" />
                          <Text className="text-sm font-bold text-brand-purple-700">Move</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Move (status) sheet */}
      <Modal visible={!!moveTarget} transparent animationType="slide" onRequestClose={() => setMoveTarget(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setMoveTarget(null)}>
          <Pressable className="max-h-[70%] rounded-t-3xl bg-white dark:bg-slate-900" onPress={() => {}}>
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Move to…</Text>
              <Pressable onPress={() => setMoveTarget(null)}><X size={22} color="#94a3b8" /></Pressable>
            </View>
            <ScrollView contentContainerClassName="p-3">
              {ALL_STATUSES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => move(s)}
                  className={`rounded-xl px-4 py-3 ${moveTarget?.status === s ? "bg-brand-purple-50 dark:bg-brand-purple-800/20" : ""}`}
                >
                  <Text className="text-base text-slate-800 dark:text-slate-100">{STATUS_LABELS[s]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
