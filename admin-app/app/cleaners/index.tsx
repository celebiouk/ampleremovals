import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, RefreshControl, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Input, Skeleton, EmptyState, ErrorState, StatCard } from "@/components/ui";
import { LargeHeader } from "@/components/shared/LargeHeader";
import { apiFetch } from "@/lib/api";

interface Cleaner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  jobs_count: number;
}

interface CleanersResponse {
  success: boolean;
  cleaners: Cleaner[];
  stats: { total: number; active: number };
}

const SEARCH_DEBOUNCE = 300;

export default function CleanersScreen() {
  const router = useRouter();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0 });
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
      const data: CleanersResponse = await apiFetch("/api/admin/cleaners").then(r => r.json());
      if (data.success) {
        setCleaners(data.cleaners || []);
        setStats(data.stats || { total: 0, active: 0 });
      }
    } catch (e) {
      console.error("Failed to load cleaners:", e);
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

  const filtered = cleaners.filter(c => {
    if (filter !== "all" && c.status !== filter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        c.first_name.toLowerCase().includes(s) ||
        c.last_name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s)
      );
    }
    return true;
  });

  const renderItem = useCallback(
    ({ item }: { item: Cleaner }) => (
      <Pressable
        onPress={() => router.push(`/cleaners/${item.id}`)}
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
      <LargeHeader title="Cleaners" />

      {/* Stats */}
      {!isLoading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-3" contentContainerClassName="gap-3">
          <StatCard icon="Sparkles" label="Total" value={String(stats.total)} variant="primary" />
          <StatCard icon="Check" label="Active" value={String(stats.active)} variant="accent" />
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
          {[
            { label: "All", value: "all" as const },
            { label: "Active", value: "active" as const },
            { label: "Inactive", value: "inactive" as const },
          ].map((f) => (
            <Pressable
              key={f.value}
              onPress={() => { setFilter(f.value); Haptics.selectionAsync().catch(() => {}); }}
              className={`rounded-full px-4 py-1.5 ${
                filter === f.value ? "bg-green-600" : "bg-slate-100 dark:bg-slate-800"
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
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <EmptyState title="No cleaners" message="No cleaners match your search or filter." />
          }
        />
      )}
    </SafeAreaView>
  );
}
