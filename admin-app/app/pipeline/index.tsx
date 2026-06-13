import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, ScrollView, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Skeleton, EmptyState } from "@/components/ui";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { ServiceBadge } from "@/components/ui/ServiceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { BookingStatus, ServiceType } from "@/types";

interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  service_type: ServiceType;
  customer_name: string;
  move_date: string | null;
  created_at: string;
}

const COLUMNS: { id: string; label: string; statuses: BookingStatus[]; colour: string }[] = [
  { id: "inquiry", label: "New Inquiries", statuses: ["inquiry"], colour: "#f1f5f9" },
  { id: "contacted", label: "Contacted", statuses: ["called", "not_called", "answered", "not_answered"], colour: "#eff6ff" },
  { id: "processing", label: "In Progress", statuses: ["processing", "pending"], colour: "#eef2ff" },
  { id: "invoice", label: "Invoices", statuses: ["deposit_invoice_sent", "full_invoice_sent"], colour: "#f3e8ff" },
  { id: "confirmed", label: "Confirmed", statuses: ["deposit_paid_job_confirmed", "full_balance_paid"], colour: "#f0fdf4" },
  { id: "completed", label: "Completed", statuses: ["job_completed"], colour: "#f0fdf4" },
  { id: "dead", label: "Dead Leads", statuses: ["bad_lead", "not_a_good_fit"], colour: "#fef2f2" },
];

export default function PipelineScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState<string | null>(COLUMNS[0].id);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/bookings?limit=999").then(r => r.json());
      if (data.success) setBookings(data.bookings || []);
    } catch (e) {
      console.error("Failed to load pipeline:", e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    await load();
    setIsRefetching(false);
  }, [load]);

  const updateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingId(bookingId);
    try {
      const response = await apiFetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        await load();
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getColumnBookings = (column: typeof COLUMNS[0]) =>
    bookings.filter(b => column.statuses.includes(b.status));

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
        <LargeHeader title="Pipeline" />
        <ScrollView className="p-5">
          {[1, 2, 3].map((i) => (
            <View key={i} className="mb-4">
              <Skeleton className="h-12 mb-3" />
              <Skeleton className="h-32 mb-3" />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <LargeHeader title="Pipeline" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        className="p-5"
        contentContainerClassName="gap-3"
      >
        {COLUMNS.map((column) => {
          const items = getColumnBookings(column);
          const isExpanded = expandedColumn === column.id;

          return (
            <View key={column.id}>
              <Pressable
                onPress={() => setExpandedColumn(isExpanded ? null : column.id)}
                className="flex-row items-center justify-between rounded-xl p-3.5"
                style={{ backgroundColor: column.colour }}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-slate-900">{column.label}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">{items.length} booking{items.length !== 1 ? "s" : ""}</Text>
                </View>
                <ChevronDown size={18} color="#94a3b8" style={{
                  transform: isExpanded ? [] : [{ rotate: "-90deg" }]
                }} />
              </Pressable>

              {isExpanded && (
                <View className="mt-2 gap-2">
                  {items.length === 0 ? (
                    <View className="rounded-xl bg-white p-4 dark:bg-slate-900 items-center py-6">
                      <Text className="text-sm text-slate-500">No bookings in this stage.</Text>
                    </View>
                  ) : (
                    items.map((booking) => (
                      <Pressable
                        key={booking.id}
                        onPress={() => router.push(`/booking/${booking.id}`)}
                        className="rounded-xl bg-white p-3.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <View className="flex-row items-start justify-between gap-2 mb-2">
                          <View className="flex-1 gap-1">
                            <View className="flex-row gap-2">
                              <ServiceBadge service={booking.service_type} />
                            </View>
                            <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
                              {booking.customer_name}
                            </Text>
                            <Text className="text-xs font-mono text-slate-400">{booking.reference}</Text>
                          </View>
                          <ChevronRight size={16} color="#94a3b8" />
                        </View>

                        {booking.move_date && (
                          <Text className="text-xs text-slate-500 mb-2">
                            📅 {formatDate(booking.move_date)}
                          </Text>
                        )}

                        <View className="flex-row gap-2 flex-wrap">
                          {COLUMNS.filter(col => col.id !== column.id).slice(0, 3).map(col => (
                            <Pressable
                              key={col.id}
                              disabled={updatingId === booking.id}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                updateStatus(booking.id, col.statuses[0]);
                              }}
                              className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1"
                            >
                              <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {col.label.split(" ")[0]}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
