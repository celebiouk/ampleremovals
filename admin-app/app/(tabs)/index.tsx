import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarClock, PoundSterling, Percent, FileWarning, Truck, Search,
} from "lucide-react-native";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { StatCard } from "@/components/dashboard/StatCard";
import { MiniBarChart } from "@/components/dashboard/MiniBarChart";
import { PipelineBars } from "@/components/dashboard/PipelineBars";
import { useDashboard } from "@/hooks/useDashboard";
import { subscribeToBookings, unsubscribe } from "@/lib/realtime";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

function pctDelta(curr: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const { session } = useAuthStore();
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Live updates: refetch when bookings change.
  useEffect(() => {
    channelRef.current = subscribeToBookings(() => refetch());
    return () => {
      unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [refetch]);

  const onRefresh = useCallback(() => refetch(), [refetch]);
  const chartWidth = width - 40 - 32; // screen - page padding - card padding

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        contentContainerClassName="p-5 gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-purple-800">
            <Truck size={22} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
              {session?.user?.email}
            </Text>
          </View>
          <Pressable
            onPress={() => setSearchOpen(true)}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <Search size={20} color="#7e22ce" />
          </Pressable>
        </View>

        <GlobalSearch visible={searchOpen} onClose={() => setSearchOpen(false)} />

        {isLoading ? (
          <DashboardSkeleton />
        ) : isError || !data ? (
          <ErrorState message="Couldn't load dashboard data." onRetry={refetch} />
        ) : (
          <>
            {/* KPI grid */}
            <View className="flex-row gap-4">
              <StatCard
                label="Today"
                value={String(data.todayBookings)}
                delta={pctDelta(data.todayBookings, data.yesterdayBookings)}
                icon={<CalendarClock size={18} color="#7e22ce" />}
              />
              <StatCard
                label="Jobs this week"
                value={String(data.weekJobs)}
                icon={<Truck size={18} color="#2563eb" />}
              />
            </View>
            <View className="flex-row gap-4">
              <StatCard
                label="Revenue (mo)"
                value={formatCurrency(data.monthRevenue)}
                delta={pctDelta(data.monthRevenue, data.lastMonthRevenue)}
                icon={<PoundSterling size={18} color="#16a34a" />}
              />
              <StatCard
                label="Conversion"
                value={`${data.conversionRate}%`}
                icon={<Percent size={18} color="#7e22ce" />}
              />
            </View>
            <StatCard
              label="Outstanding invoices"
              value={formatCurrency(data.outstanding)}
              icon={<FileWarning size={18} color="#f59e0b" />}
            />

            {/* New bookings chart */}
            <Card>
              <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                New bookings · last 7 days
              </Text>
              <MiniBarChart
                data={data.sparkline.map((s) => ({ label: s.day, value: s.count }))}
                width={chartWidth}
              />
            </Card>

            {/* Pipeline */}
            {data.pipeline.length > 0 && (
              <Card>
                <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
                  Pipeline
                </Text>
                <PipelineBars data={data.pipeline} />
              </Card>
            )}

            {/* Recent activity */}
            <Card>
              <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                Recent activity
              </Text>
              {data.activity.length === 0 ? (
                <Text className="text-sm text-slate-500">No recent activity.</Text>
              ) : (
                <View className="gap-3">
                  {data.activity.slice(0, 12).map((a) => (
                    <View key={a.id} className="flex-row gap-3">
                      <View className="mt-1.5 h-2 w-2 rounded-full bg-brand-purple-600" />
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardSkeleton() {
  return (
    <View className="gap-4">
      <View className="flex-row gap-4">
        <Skeleton className="h-24 flex-1" />
        <Skeleton className="h-24 flex-1" />
      </View>
      <View className="flex-row gap-4">
        <Skeleton className="h-24 flex-1" />
        <Skeleton className="h-24 flex-1" />
      </View>
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </View>
  );
}
