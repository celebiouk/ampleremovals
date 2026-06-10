import { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ArrowLeft, Check, CheckCheck, Download, PoundSterling } from "lucide-react-native";
import { Card, Badge, Skeleton, ErrorState, EmptyState } from "@/components/ui";
import { useEarnings, type EarningRow } from "@/hooks/useEarnings";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { EARNINGS_STATUS_LABELS, EARNINGS_STATUS_COLOURS } from "@/lib/constants";
import type { EarningsStatus } from "@/types";

type Tab = "all" | EarningsStatus;

export default function EarningsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useEarnings();
  const [tab, setTab] = useState<Tab>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  const earnings = data?.earnings ?? [];
  const totals = useMemo(() => {
    const sum = (s: EarningsStatus) => earnings.filter((e) => e.status === s).reduce((a, e) => a + e.total_earnings, 0);
    return { pending: sum("pending"), approved: sum("approved"), paid: sum("paid") };
  }, [earnings]);

  const counts = useMemo(() => ({
    pending: earnings.filter((e) => e.status === "pending").length,
    approved: earnings.filter((e) => e.status === "approved").length,
    paid: earnings.filter((e) => e.status === "paid").length,
  }), [earnings]);

  const filtered = tab === "all" ? earnings : earnings.filter((e) => e.status === tab);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["earnings"] });
    qc.invalidateQueries({ queryKey: ["drivers"] });
  }

  async function approve(id: string) {
    setBusy(id);
    try { await apiFetch(`/api/admin/earnings/${id}/approve`, { method: "POST" }); refresh(); }
    catch (e) { Alert.alert("Error", e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }
  async function pay(id: string) {
    setBusy(id);
    try { await apiFetch(`/api/admin/earnings/${id}/pay`, { method: "POST" }); refresh(); }
    catch (e) { Alert.alert("Error", e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  async function bulkApprove() {
    const pending = earnings.filter((e) => e.status === "pending");
    if (pending.length === 0) { Alert.alert("Nothing to approve", "No pending earnings."); return; }
    setBulk(true);
    try {
      await Promise.allSettled(pending.map((e) => apiFetch(`/api/admin/earnings/${e.id}/approve`, { method: "POST" })));
      refresh();
      Alert.alert("Done", `Approved ${pending.length} earning(s).`);
    } finally { setBulk(false); }
  }

  async function exportCSV() {
    const rows = filtered;
    if (rows.length === 0) { Alert.alert("Nothing to export", "No earnings in this view."); return; }
    const header = ["Driver", "Booking", "Pay %", "Gross", "Tips", "Total", "Status", "Paid Date"];
    const csv = [
      header.join(","),
      ...rows.map((e) => [
        `${e.driver?.first_name ?? ""} ${e.driver?.last_name ?? ""}`.trim(),
        e.booking?.reference ?? "",
        e.pay_percentage,
        e.gross_earnings.toFixed(2),
        e.tip_amount.toFixed(2),
        e.total_earnings.toFixed(2),
        e.status,
        e.paid_at ? new Date(e.paid_at).toLocaleDateString("en-GB") : "",
      ].map((c) => `"${c}"`).join(",")),
    ].join("\n");
    try {
      const uri = FileSystem.cacheDirectory + `driver-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "text/csv" });
      else Alert.alert("Exported", "Sharing not available on this device.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Export failed");
    }
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: earnings.length },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "paid", label: "Paid", count: counts.paid },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="border-b border-slate-200 px-4 pb-3 pt-2 dark:border-slate-800">
        <View className="mb-3 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-1"><ArrowLeft size={24} color="#7e22ce" /></Pressable>
          <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-white">Driver Earnings</Text>
          <Pressable onPress={exportCSV} className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Download size={18} color="#7e22ce" />
          </Pressable>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 ${active ? "bg-brand-purple-800" : "bg-slate-100 dark:bg-slate-800"}`}>
                <Text className={`text-sm font-medium ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{t.label}</Text>
                <Text className={`text-xs font-bold ${active ? "text-white" : "text-slate-400"}`}>{t.count}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View className="gap-3 p-5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</View>
      ) : isError ? (
        <ErrorState message="Couldn't load earnings." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerClassName="p-5 gap-3 pb-12" refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {/* Summary */}
          <View className="flex-row gap-3">
            <Summary label="Pending" value={formatCurrency(totals.pending)} colour="text-amber-600" />
            <Summary label="Approved" value={formatCurrency(totals.approved)} colour="text-green-600" />
            <Summary label="Paid" value={formatCurrency(totals.paid)} colour="text-blue-600" />
          </View>

          {counts.pending > 0 ? (
            <Pressable onPress={bulkApprove} disabled={bulk} className="flex-row items-center justify-center gap-2 rounded-xl bg-brand-green-600 py-3">
              <CheckCheck size={18} color="#fff" />
              <Text className="font-semibold text-white">{bulk ? "Approving…" : `Approve all pending (${counts.pending})`}</Text>
            </Pressable>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState title="No earnings" message="Earnings appear once invoices are paid." icon={<PoundSterling size={40} color="#94a3b8" />} />
          ) : (
            filtered.map((e: EarningRow) => (
              <Card key={e.id}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-900 dark:text-white">
                      {e.driver?.first_name} {e.driver?.last_name}
                    </Text>
                    <Text className="font-mono text-xs text-slate-400">{e.booking?.reference}</Text>
                  </View>
                  <Badge label={EARNINGS_STATUS_LABELS[e.status]} colour={EARNINGS_STATUS_COLOURS[e.status]} />
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(e.total_earnings)}</Text>
                    <Text className="text-xs text-slate-400">{e.pay_percentage}% + {formatCurrency(e.tip_amount)} tips</Text>
                  </View>
                  {e.status === "pending" ? (
                    <Pressable onPress={() => approve(e.id)} disabled={busy === e.id} className="flex-row items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2">
                      <Check size={16} color="#fff" /><Text className="text-sm font-semibold text-white">{busy === e.id ? "…" : "Approve"}</Text>
                    </Pressable>
                  ) : e.status === "approved" ? (
                    <Pressable onPress={() => pay(e.id)} disabled={busy === e.id} className="flex-row items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2">
                      <PoundSterling size={16} color="#fff" /><Text className="text-sm font-semibold text-white">{busy === e.id ? "…" : "Mark paid"}</Text>
                    </Pressable>
                  ) : (
                    <View className="flex-row items-center gap-1"><Check size={16} color="#64748b" /><Text className="text-sm text-slate-500">Paid</Text></View>
                  )}
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Summary({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <Card className="flex-1 p-3">
      <Text className="text-xs font-medium uppercase text-slate-500">{label}</Text>
      <Text className={`mt-1 text-base font-bold ${colour}`}>{value}</Text>
    </Card>
  );
}
