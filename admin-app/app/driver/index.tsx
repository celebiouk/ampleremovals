import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, RefreshControl, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, ChevronRight, Plus, Truck } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Input, Skeleton, EmptyState, ErrorState, StatCard } from "@/components/ui";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended" | "on_leave";
  default_pay_percentage: number;
  jobs_count: number;
}

interface DriversResponse {
  success: boolean;
  drivers: Driver[];
  stats: { total: number; active: number; inactive: number; jobsThisWeek: number };
}

const SEARCH_DEBOUNCE = 300;
const FILTER_OPTIONS = [
  { label: "All", value: "all" as const },
  { label: "Active", value: "active" as const },
  { label: "Inactive", value: "inactive" as const },
];

export default function DriversScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, jobsThisWeek: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search]);

  const load = useCallback(async () => {
    try {
      const data: DriversResponse = await apiFetch("/api/admin/drivers").then(r => r.json());
      if (data.success) {
        setDrivers(data.drivers || []);
        setStats(data.stats || { total: 0, active: 0, inactive: 0, jobsThisWeek: 0 });
      }
    } catch (e) {
      console.error("Failed to load drivers:", e);
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

  const filtered = drivers.filter(d => {
    if (filter !== "all" && d.status !== filter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        d.first_name.toLowerCase().includes(s) ||
        d.last_name.toLowerCase().includes(s) ||
        d.email.toLowerCase().includes(s) ||
        d.phone.includes(s)
      );
    }
    return true;
  });

  const renderItem = useCallback(
    ({ item }: { item: Driver }) => (
      <Pressable
        onPress={() => router.push(`/driver/${item.id}`)}
        className="border-b border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              {item.first_name} {item.last_name}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.email}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className={`rounded-full px-2 py-0.5 ${
                item.status === "active" ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-100 dark:bg-slate-800"
              }`}>
                <Text className={`text-xs font-medium capitalize ${
                  item.status === "active" ? "text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-400"
                }`}>
                  {item.status}
                </Text>
              </View>
              {item.jobs_count > 0 && (
                <Text className="text-xs text-slate-500 dark:text-slate-400">{item.jobs_count} jobs</Text>
              )}
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </View>
      </Pressable>
    ),
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <LargeHeader title="Drivers" />

      {/* Stats (if data loaded) */}
      {!isLoading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-3" contentContainerClassName="gap-3">
          <StatCard icon="Users" label="Total" value={String(stats.total)} variant="primary" />
          <StatCard icon="Truck" label="Active" value={String(stats.active)} variant="accent" />
          <StatCard icon="Calendar" label="This Week" value={String(stats.jobsThisWeek)} variant="primary" />
        </ScrollView>
      )}

      {/* Search & Filters */}
      <View className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <View className="relative mb-3">
          <View className="absolute left-3 top-3.5 z-10">
            <Search size={18} color="#94a3b8" />
          </View>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email, phone"
            autoCapitalize="none"
            className="pl-10"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {FILTER_OPTIONS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => { setFilter(f.value); Haptics.selectionAsync().catch(() => {}); }}
              className={`rounded-full px-4 py-1.5 ${
                filter === f.value ? "bg-brand-purple-800" : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <Text className={`text-sm font-medium ${
                filter === f.value ? "text-white" : "text-slate-600 dark:text-slate-300"
              }`}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="gap-3 p-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState title="No drivers" message="No drivers match your search or filter." />
          }
        />
      )}
    </SafeAreaView>
  );
}
