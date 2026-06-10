import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View, Text, RefreshControl, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PoundSterling, Percent, FileWarning } from "lucide-react-native";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { MiniBarChart } from "@/components/dashboard/MiniBarChart";
import { PipelineBars } from "@/components/dashboard/PipelineBars";
import { useDashboard } from "@/hooks/useDashboard";
import { subscribeToBookings, unsubscribe } from "@/lib/realtime";
import { colors } from "@/lib/colors";
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

  // First name for the greeting — from the admin's profile metadata, falling
  // back to the email prefix if no name is set.
  const fullName = (session?.user?.user_metadata?.full_name as string | undefined)?.trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : session?.user?.email?.split("@")[0];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        <DashboardHero
          name={firstName}
          monthRevenue={data?.monthRevenue ?? 0}
          monthDelta={data ? pctDelta(data.monthRevenue, data.lastMonthRevenue) : null}
          todayBookings={data?.todayBookings ?? 0}
          weekJobs={data?.weekJobs ?? 0}
          onSearch={() => setSearchOpen(true)}
        />

        <GlobalSearch visible={searchOpen} onClose={() => setSearchOpen(false)} />

        <View className="gap-4 p-5">
          {isLoading ? (
            <DashboardSkeleton />
          ) : isError || !data ? (
            <ErrorState message="Couldn't load dashboard data." onRetry={refetch} />
          ) : (
            <>
              {/* Overview */}
              <Text className="font-display text-lg text-slate-900">Overview</Text>
              <View className="flex-row gap-4">
                <StatCard
                  label="Outstanding"
                  value={formatCurrency(data.outstanding)}
                  countTo={data.outstanding}
                  format={formatCurrency}
                  gradient={["#fbbf24", "#f59e0b"]}
                  icon={<FileWarning size={20} color="#fff" />}
                />
                <StatCard
                  label="Conversion"
                  value={`${data.conversionRate}%`}
                  countTo={data.conversionRate}
                  format={(n) => `${Math.round(n)}%`}
                  gradient={[colors.primary.lighter, colors.primary.light]}
                  icon={<Percent size={20} color="#fff" />}
                />
              </View>
              <StatCard
                label="Revenue this month"
                value={formatCurrency(data.monthRevenue)}
                countTo={data.monthRevenue}
                format={formatCurrency}
                delta={pctDelta(data.monthRevenue, data.lastMonthRevenue)}
                gradient={["#34d399", "#16a34a"]}
                icon={<PoundSterling size={20} color="#fff" />}
              />

              {/* New bookings chart */}
              <Card>
                <Text className="mb-3 font-display text-base text-slate-900">
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
                  <Text className="mb-4 font-display text-base text-slate-900">Pipeline</Text>
                  <PipelineBars data={data.pipeline} />
                </Card>
              )}

              {/* Recent activity */}
              <Card>
                <Text className="mb-3 font-display text-base text-slate-900">Recent activity</Text>
                {data.activity.length === 0 ? (
                  <Text className="text-sm text-slate-500">No recent activity.</Text>
                ) : (
                  <View className="gap-3.5">
                    {data.activity.slice(0, 12).map((a) => (
                      <View key={a.id} className="flex-row gap-3">
                        <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-purple-600" />
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-slate-800">{a.action}</Text>
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
        </View>
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
