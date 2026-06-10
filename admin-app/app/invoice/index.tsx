import { useState } from "react";
import { View, Text, FlatList, Pressable, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { Badge, Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { useInvoices, type InvoiceRow } from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLOURS } from "@/lib/constants";
import type { InvoiceStatus } from "@/types";

const FILTERS: { label: string; value: InvoiceStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default function InvoicesScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const { data, isLoading, isError, refetch, isRefetching } = useInvoices(status);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 px-4 pb-3 pt-2 dark:border-slate-800">
        <View className="mb-3 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
          {FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Pressable key={f.label} onPress={() => setStatus(f.value)} className={`rounded-full px-3.5 py-1.5 ${active ? "bg-brand-purple-800" : "bg-slate-100 dark:bg-slate-800"}`}>
                <Text className={`text-sm font-medium ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24" />)}</View>
      ) : isError ? (
        <ErrorState message="Couldn't load invoices." onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerClassName="p-5 gap-3"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState title="No invoices" message="Nothing in this filter." />}
          renderItem={({ item }: { item: InvoiceRow }) => (
            <Pressable
              onPress={() => router.push(`/invoice/${item.id}`)}
              className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <View className="flex-1">
                <View className="mb-1.5 flex-row flex-wrap items-center gap-2">
                  <Badge label={INVOICE_STATUS_LABELS[item.status]} colour={INVOICE_STATUS_COLOURS[item.status]} />
                  <Badge label={item.type === "deposit" ? "Deposit" : "Full"} colour="bg-slate-100 text-slate-600" />
                </View>
                <Text className="font-semibold text-slate-900 dark:text-white">{item.customer_name}</Text>
                <Text className="font-mono text-xs text-slate-400">{item.invoice_number} · {item.booking_reference}</Text>
                {item.due_date ? <Text className="mt-0.5 text-xs text-slate-400">Due {formatDate(item.due_date)}</Text> : null}
              </View>
              <View className="items-end">
                <Text className="text-base font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</Text>
                <ChevronRight size={18} color="#94a3b8" />
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
