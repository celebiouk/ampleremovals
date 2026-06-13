import { useState, useMemo } from "react";
import { ScrollView, View, Text, Pressable, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowRight } from "lucide-react-native";
import { Card, Badge, Skeleton, ErrorState, EmptyState } from "@/components/ui";
import { usePayRuns } from "@/hooks/usePayRuns";
import { formatCurrency } from "@/lib/utils";

type SortBy = "date" | "status" | "workers";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  finalised: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function PayrollScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = usePayRuns();
  const [sortBy, setSortBy] = useState<SortBy>("date");

  const runs = data?.data ?? [];

  const sorted = useMemo(() => {
    const copy = [...runs];
    if (sortBy === "date") copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "status") copy.sort((a, b) => a.status.localeCompare(b.status));
    else if (sortBy === "workers") copy.sort((a, b) => (b.payslips?.length ?? 0) - (a.payslips?.length ?? 0));
    return copy;
  }, [runs, sortBy]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["payRuns"] });
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView className="flex-1 px-4 py-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-32 rounded-lg" />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView
          className="flex-1 px-4 py-6"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} />}
        >
          <ErrorState message="Failed to load pay runs" onRetry={refresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 px-4 py-6"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} />}
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Payroll</Text>
            <Text className="mt-1 text-sm text-slate-600">Pay runs and payslips</Text>
          </View>
          <Pressable
            onPress={() => router.push("/payroll-new")}
            className="rounded-full bg-purple-600 p-3"
          >
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        {/* Sort tabs */}
        <View className="mb-4 flex-row gap-2">
          {(["date", "status", "workers"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSortBy(s)}
              className={`rounded-full px-3 py-1.5 ${
                sortBy === s ? "bg-purple-600" : "bg-white"
              }`}
            >
              <Text className={`text-xs font-medium capitalize ${
                sortBy === s ? "text-white" : "text-slate-700"
              }`}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Runs list */}
        {sorted.length === 0 ? (
          <EmptyState message="No pay runs yet. Create one to get started." />
        ) : (
          <View className="gap-3">
            {sorted.map((run) => (
              <Pressable
                key={run.id}
                onPress={() => router.push(`/payroll/${run.id}`)}
                className="active:opacity-70"
              >
                <Card className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="mb-1 flex-row items-center gap-2">
                        <Text className="font-semibold text-slate-900">{run.reference}</Text>
                        <Badge
                          label={run.status}
                          className={STATUS_COLORS[run.status as keyof typeof STATUS_COLORS]}
                        />
                      </View>
                      <Text className="text-xs text-slate-600">
                        {new Date(run.period_start).toLocaleDateString("en-GB")} –{" "}
                        {new Date(run.period_end).toLocaleDateString("en-GB")}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-medium text-slate-900">
                        {run.payslips?.length ?? 0} workers
                      </Text>
                      <ArrowRight size={16} color="#9ca3af" />
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
