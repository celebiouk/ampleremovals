import { useEffect } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react-native";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { useNotifications, type NotificationRow } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();

  // Live updates
  useEffect(() => {
    const ch = supabase
      .channel(`notifications-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () =>
        qc.invalidateQueries({ queryKey: ["notifications"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">
          Notifications{unread > 0 ? ` (${unread})` : ""}
        </Text>
        {unread > 0 ? (
          <Pressable onPress={markAllRead} className="flex-row items-center gap-1 p-1">
            <CheckCheck size={16} color="#7e22ce" /><Text className="text-sm font-medium text-brand-purple-700">Mark all</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}</View>
      ) : isError ? (
        <ErrorState message="Couldn't load notifications." onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerClassName="p-5 gap-2"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="All caught up" message="No notifications." icon={<Bell size={40} color="#94a3b8" />} />}
          renderItem={({ item }: { item: NotificationRow }) => (
            <Pressable
              onPress={() => {
                if (!item.is_read) markRead(item.id);
                if (item.booking_id) router.push(`/booking/${item.booking_id}`);
              }}
              className={`flex-row gap-3 rounded-2xl border p-4 ${item.is_read ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" : "border-brand-purple-200 bg-brand-purple-50 dark:border-brand-purple-800 dark:bg-brand-purple-950/30"}`}
            >
              {!item.is_read ? <View className="mt-1.5 h-2 w-2 rounded-full bg-brand-purple-600" /> : <View className="w-2" />}
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 dark:text-white">{item.title}</Text>
                <Text className="text-sm text-slate-600 dark:text-slate-300">{item.description}</Text>
                <Text className="mt-0.5 text-xs text-slate-400">{formatDateTime(item.created_at)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
