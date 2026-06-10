import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, RefreshControl, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Input, Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { BookingCard } from "@/components/booking/BookingCard";
import { useBookings, type BookingRow } from "@/hooks/useBookings";
import { subscribeToBookings, unsubscribe } from "@/lib/realtime";
import { STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/types";

const FILTERS: { label: string; value: BookingStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Inquiry", value: "inquiry" },
  { label: "Pending", value: "pending" },
  { label: STATUS_LABELS.deposit_invoice_sent, value: "deposit_invoice_sent" },
  { label: "Confirmed", value: "deposit_paid_job_confirmed" },
  { label: STATUS_LABELS.full_invoice_sent, value: "full_invoice_sent" },
  { label: "Completed", value: "job_completed" },
];

export default function BookingsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const { data, isLoading, isError, refetch, isRefetching } = useBookings({ search, status });
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = subscribeToBookings(() => refetch());
    return () => {
      unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: BookingRow }) => (
      <BookingCard booking={item} onPress={() => router.push(`/booking/${item.id}`)} />
    ),
    [router]
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerClassName="gap-2 pr-4"
        >
          {FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setStatus(f.value)}
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
    </SafeAreaView>
  );
}
