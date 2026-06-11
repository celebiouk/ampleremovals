import { useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import { StatCard } from "@/components/dashboard/StatCard";
import { MiniBarChart } from "@/components/dashboard/MiniBarChart";
import { PipelineBars } from "@/components/dashboard/PipelineBars";
import { useReports } from "@/hooks/useReports";
import { formatCurrency } from "@/lib/utils";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "360d", days: 360 },
];
const COLS = ["#6b21a8", "#2563eb", "#16a34a", "#f59e0b", "#ec4899"];

export default function ReportsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, refetch, isRefetching } = useReports(days);
  const chartWidth = width - 40 - 32;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 px-4 pb-3 pt-2 dark:border-slate-800">
        <View className="mb-3 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
          <Text className="flex-1 font-display text-2xl text-slate-900">Reports</Text>
        </View>
        <View className="flex-row gap-1.5">
          {RANGES.map((r) => {
            const active = days === r.days;
            return (
              <Pressable
                key={r.days}
                onPress={() => setDays(r.days)}
                className={`flex-1 items-center rounded-full px-1 py-1.5 ${active ? "bg-brand-purple-800" : "bg-slate-100 dark:bg-slate-800"}`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View className="gap-4 p-5"><Skeleton className="h-24" /><Skeleton className="h-40" /><Skeleton className="h-40" /></View>
      ) : isError || !data ? (
        <ErrorState message="Couldn't load reports." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerClassName="p-5 gap-4 pb-12" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          <View className="flex-row gap-4">
            <StatCard label="Bookings" value={String(data.totalBookings)} />
            <StatCard label="Completed" value={String(data.completed)} />
          </View>
          <StatCard label={`Revenue (last ${days}d)`} value={formatCurrency(data.revenue)} />

          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Bookings over time</Text>
            <MiniBarChart data={data.byDay} width={chartWidth} />
          </Card>

          {data.byService.length > 0 && (
            <Card>
              <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-white">By service</Text>
              <PipelineBars data={data.byService.map((s, i) => ({ name: s.label, value: s.value, colour: COLS[i % COLS.length] }))} />
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
