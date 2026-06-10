import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { UserPlus, Link2, ChevronRight, Truck } from "lucide-react-native";
import { Skeleton, ErrorState, EmptyState, Badge } from "@/components/ui";
import { useDrivers, isPending, type DriverRow } from "@/hooks/useDrivers";
import { DRIVER_STATUS_LABELS, DRIVER_STATUS_COLOURS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { ENV } from "@/lib/env";

type Tab = "all" | "active" | "inactive" | "pending";

export default function DriversScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useDrivers();
  const [tab, setTab] = useState<Tab>("all");

  const drivers = data?.drivers ?? [];
  const stats = data?.stats;
  const pendingCount = useMemo(() => drivers.filter(isPending).length, [drivers]);

  const filtered = useMemo(() => {
    switch (tab) {
      case "active": return drivers.filter((d) => d.status === "active");
      case "inactive": return drivers.filter((d) => ["inactive", "suspended", "on_leave"].includes(d.status) && !isPending(d));
      case "pending": return drivers.filter(isPending);
      default: return drivers;
    }
  }, [drivers, tab]);

  async function shareInvite() {
    const url = `${ENV.SITE_URL}/drivers/register`;
    await Share.share({ message: `Join the Ample Removals driver team — register here: ${url}` });
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: stats?.total },
    { key: "active", label: "Active", count: stats?.active },
    { key: "inactive", label: "Inactive", count: stats?.inactive },
    { key: "pending", label: "Pending", count: pendingCount },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 px-5 pb-3 pt-2 dark:border-slate-800">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Drivers</Text>
          <View className="flex-row gap-2">
            <Pressable onPress={shareInvite} className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <Link2 size={18} color="#7e22ce" />
            </Pressable>
            <Pressable onPress={() => router.push("/driver/new")} className="h-10 flex-row items-center gap-1.5 rounded-xl bg-brand-green-600 px-3">
              <UserPlus size={16} color="#fff" />
              <Text className="text-sm font-semibold text-white">Add</Text>
            </Pressable>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            const amber = t.key === "pending" && (t.count ?? 0) > 0;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 ${
                  active ? (amber ? "bg-amber-600" : "bg-brand-purple-800") : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <Text className={`text-sm font-medium ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                  {t.label}
                </Text>
                {typeof t.count === "number" ? (
                  <Text className={`text-xs font-bold ${active ? "text-white" : amber ? "text-amber-600" : "text-slate-400"}`}>
                    {t.count}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</View>
      ) : isError ? (
        <ErrorState message="Couldn't load drivers." onRetry={refetch} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerClassName="p-5 gap-3"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No drivers" message="No drivers in this filter." icon={<Truck size={40} color="#94a3b8" />} />}
          renderItem={({ item }: { item: DriverRow }) => {
            const pending = isPending(item);
            return (
              <Pressable
                onPress={() => router.push(`/driver/${item.id}`)}
                className={`flex-row items-center gap-3 rounded-2xl border p-4 ${
                  pending ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-purple-100">
                  <Text className="font-bold text-brand-purple-700">
                    {item.first_name?.[0]}{item.last_name?.[0]}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{item.phone}</Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    {pending ? (
                      <Badge label="Pending Approval" colour="bg-amber-100 text-amber-700" />
                    ) : (
                      <Badge label={DRIVER_STATUS_LABELS[item.status]} colour={DRIVER_STATUS_COLOURS[item.status]} />
                    )}
                    {item.earnings_owed > 0 ? (
                      <Text className="text-xs text-slate-500">{formatCurrency(item.earnings_owed)} owed</Text>
                    ) : null}
                  </View>
                </View>
                <ChevronRight size={18} color="#94a3b8" />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
