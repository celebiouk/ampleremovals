import { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { ArrowLeft, Download, CheckCheck, Loader2 } from "lucide-react-native";
import { Card, Badge, Skeleton, ErrorState } from "@/components/ui";
import { usePayRunDetail } from "@/hooks/usePayRunDetail";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  finalised: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function PayRunDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const qc = useQueryClient();
  const runId = id as string;

  const { data, isLoading, isError, refetch, isRefetching } = usePayRunDetail(runId);
  const [paying, setPaying] = useState(false);
  const [exporting, setExporting] = useState(false);

  const run = data?.data?.run;
  const totals = data?.data?.totals;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["payRunDetail", runId] });
  }

  async function payAll() {
    Alert.alert("Pay all payslips?", "Mark all payslips in this run as paid.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pay",
        style: "default",
        onPress: async () => {
          setPaying(true);
          try {
            await apiFetch(`/api/admin/pay-runs/${runId}/pay-all`, {
              method: "PATCH",
              body: JSON.stringify({ paymentMethod: "bank_transfer" }),
            });
            refresh();
            Alert.alert("Success", "Payslips marked as paid");
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Failed to pay");
          } finally {
            setPaying(false);
          }
        },
      },
    ]);
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const response = await apiFetch(`/api/admin/pay-runs/${runId}/export`, { method: "GET" });
      const csv = await response.text();
      const uri = FileSystem.cacheDirectory + `payroll-${run?.reference}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "text/csv" });
      else Alert.alert("Exported", "CSV ready to share");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView className="flex-1 px-4 py-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-20 rounded-lg" />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !run || !totals) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView
          className="flex-1 px-4 py-6"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} />}
        >
          <ErrorState message="Failed to load pay run" onRetry={refresh} />
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
        <View className="mb-6">
          <Pressable onPress={() => router.back()} className="mb-4 flex-row items-center gap-2">
            <ArrowLeft size={20} color="#9ca3af" />
            <Text className="text-sm font-medium text-slate-600">Back</Text>
          </Pressable>

          <View>
            <Text className="text-2xl font-bold text-slate-900">{run.reference}</Text>
            <Text className="mt-1 text-sm text-slate-600">
              {new Date(run.period_start).toLocaleDateString("en-GB")} –{" "}
              {new Date(run.period_end).toLocaleDateString("en-GB")}
            </Text>
          </View>
        </View>

        {/* Totals grid */}
        <View className="mb-6 grid grid-cols-2 gap-3">
          <Card className="p-3">
            <Text className="text-xs font-medium text-slate-600">Gross</Text>
            <Text className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(totals.gross)}
            </Text>
          </Card>
          <Card className="p-3">
            <Text className="text-xs font-medium text-slate-600">Tips</Text>
            <Text className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(totals.tips)}
            </Text>
          </Card>
          <Card className="p-3">
            <Text className="text-xs font-medium text-slate-600">Adjustments</Text>
            <Text className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(totals.adjustments)}
            </Text>
          </Card>
          <Card className="p-3">
            <Text className="text-xs font-medium text-slate-600">Net</Text>
            <Text className="mt-1 text-lg font-bold text-purple-600">
              {formatCurrency(totals.net)}
            </Text>
          </Card>
        </View>

        {/* Actions */}
        <View className="mb-6 gap-2">
          <Pressable
            onPress={exportCSV}
            disabled={exporting}
            className="flex-row items-center justify-center gap-2 rounded-lg bg-white px-4 py-3"
          >
            <Download size={18} color="#7c3aed" />
            <Text className="font-medium text-purple-600">
              {exporting ? "Exporting..." : "Export CSV"}
            </Text>
          </Pressable>
          <Pressable
            onPress={payAll}
            disabled={paying || totals.pending === 0}
            className={`flex-row items-center justify-center gap-2 rounded-lg px-4 py-3 ${
              paying || totals.pending === 0 ? "bg-slate-200" : "bg-green-600"
            }`}
          >
            <CheckCheck size={18} color={paying || totals.pending === 0 ? "#999" : "white"} />
            <Text className={`font-medium ${
              paying || totals.pending === 0 ? "text-slate-500" : "text-white"
            }`}>
              {paying ? "Processing..." : `Pay all (${totals.pending})`}
            </Text>
          </Pressable>
        </View>

        {/* Payslips list */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-bold text-slate-900">Payslips</Text>
          <FlatList
            scrollEnabled={false}
            data={run.payslips}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item: ps }) => (
              <Pressable
                onPress={() => router.push(`/payslip/${ps.id}`)}
                className="active:opacity-70"
              >
                <Card className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-medium text-slate-900">
                        {ps.worker_type === "driver" ? "Driver" : "Cleaner"}
                      </Text>
                      <Text className="text-xs text-slate-600">
                        Gross: {formatCurrency(ps.gross_earnings)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-purple-600">
                        {formatCurrency(ps.net_pay)}
                      </Text>
                      <Badge
                        label={ps.status}
                        className={ps.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"}
                      />
                    </View>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
