import { ScrollView, View, Text, Pressable, Switch, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Zap } from "lucide-react-native";
import { Card, Skeleton, ErrorState } from "@/components/ui";
import { useAutomations } from "@/hooks/useAutomations";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";

export default function AutomationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useAutomations();

  async function toggle(id: string, value: boolean) {
    try {
      await supabase.from("automation_rules").update({ is_active: value }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["automations"] });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Automations</Text>
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</View>
      ) : isError || !data ? (
        <ErrorState message="Couldn't load automations." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerClassName="p-5 gap-4 pb-12" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          <Card>
            <Text className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Rules</Text>
            <Text className="mb-3 text-xs text-slate-500">Toggle automated email/SMS/WhatsApp flows on or off.</Text>
            {data.rules.length === 0 ? (
              <Text className="text-sm text-slate-500">No rules configured.</Text>
            ) : (
              data.rules.map((r, i) => (
                <View key={r.id} className={`flex-row items-center gap-3 py-3 ${i > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}`}>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-purple-100"><Zap size={16} color="#7e22ce" /></View>
                  <View className="flex-1">
                    <Text className="font-medium text-slate-900 dark:text-white">{r.name}</Text>
                    <Text className="text-xs text-slate-400">
                      {r.trigger_event}{r.delay_minutes ? ` · +${r.delay_minutes}m` : ""}
                    </Text>
                  </View>
                  <Switch
                    value={!!r.is_active}
                    onValueChange={(v) => toggle(r.id, v)}
                    trackColor={{ true: "#7e22ce", false: "#cbd5e1" }}
                    thumbColor="#fff"
                  />
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Recent runs</Text>
            {data.logs.length === 0 ? (
              <Text className="text-sm text-slate-500">No automation runs yet.</Text>
            ) : (
              <View className="gap-3">
                {data.logs.map((l) => (
                  <View key={l.id} className="flex-row items-center gap-3">
                    <View className={`h-2 w-2 rounded-full ${l.status === "sent" || l.status === "completed" ? "bg-green-500" : l.status === "pending" ? "bg-amber-500" : "bg-slate-400"}`} />
                    <View className="flex-1">
                      <Text className="text-sm capitalize text-slate-800 dark:text-slate-200">{l.status}</Text>
                      <Text className="text-xs text-slate-400">{formatDateTime(l.triggered_at)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
