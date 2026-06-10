import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ArrowLeft, Download, CreditCard } from "lucide-react-native";
import { Card, Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { usePayments, type PaymentRow } from "@/hooks/usePayments";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function PaymentsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = usePayments();
  const total = (data ?? []).reduce((a, p) => a + p.amount, 0);

  async function exportCSV() {
    const rows = data ?? [];
    if (rows.length === 0) { Alert.alert("Nothing to export", "No payments yet."); return; }
    const csv = [
      ["Date", "Customer", "Invoice", "Method", "Amount"].join(","),
      ...rows.map((p) => [
        new Date(p.paid_at).toLocaleString("en-GB"),
        p.customer_name, p.invoice_number, p.payment_method ?? "",
        p.amount.toFixed(2),
      ].map((c) => `"${c}"`).join(",")),
    ].join("\n");
    try {
      const uri = FileSystem.cacheDirectory + `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "text/csv" });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
        <Text className="flex-1 font-display text-2xl text-slate-900">Payments</Text>
        <Pressable onPress={exportCSV} className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Download size={18} color="#7e22ce" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20" />)}</View>
      ) : isError ? (
        <ErrorState message="Couldn't load payments." onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerClassName="p-5 gap-3"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListHeaderComponent={
            (data ?? []).length > 0 ? (
              <Card className="mb-1">
                <Text className="text-xs font-medium uppercase text-slate-500">Total received</Text>
                <Text className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(total)}</Text>
              </Card>
            ) : null
          }
          ListEmptyComponent={<EmptyState title="No payments" message="Payments appear here once invoices are paid." icon={<CreditCard size={40} color="#94a3b8" />} />}
          renderItem={({ item }: { item: PaymentRow }) => (
            <View className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 dark:text-white">{item.customer_name}</Text>
                <Text className="font-mono text-xs text-slate-400">{item.invoice_number}</Text>
                <Text className="mt-0.5 text-xs text-slate-400">
                  {formatDateTime(item.paid_at)}{item.payment_method ? ` · ${item.payment_method.replace("_", " ")}` : ""}
                </Text>
              </View>
              <Text className="text-base font-bold text-green-600">{formatCurrency(item.amount)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
