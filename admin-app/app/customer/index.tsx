import { useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, ChevronRight, Mail, Phone } from "lucide-react-native";
import { Input, Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { useCustomers, type CustomerRow } from "@/hooks/useCustomers";

export default function CustomersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useCustomers(search);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 px-4 pb-3 pt-2 dark:border-slate-800">
        <View className="mb-3 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Customers</Text>
        </View>
        <View className="relative">
          <View className="absolute left-3 top-3.5 z-10"><Search size={18} color="#94a3b8" /></View>
          <Input value={search} onChangeText={setSearch} placeholder="Search name, email, phone" autoCapitalize="none" className="pl-10" />
        </View>
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20" />)}</View>
      ) : isError ? (
        <ErrorState message="Couldn't load customers." onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerClassName="p-5 gap-3"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No customers" message="Nothing matches your search." />}
          renderItem={({ item }: { item: CustomerRow }) => (
            <Pressable
              onPress={() => router.push(`/customer/${item.id}`)}
              className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-purple-100">
                <Text className="font-bold text-brand-purple-700">{item.full_name?.[0]?.toUpperCase() ?? "?"}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 dark:text-white">{item.full_name}</Text>
                <View className="mt-0.5 flex-row items-center gap-3">
                  {item.email ? (
                    <View className="flex-row items-center gap-1"><Mail size={12} color="#94a3b8" /><Text className="text-xs text-slate-500" numberOfLines={1}>{item.email}</Text></View>
                  ) : null}
                </View>
                <Text className="mt-0.5 text-xs text-slate-400">{item.booking_count} booking{item.booking_count === 1 ? "" : "s"}</Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
