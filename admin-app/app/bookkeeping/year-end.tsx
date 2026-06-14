import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { Download, Info, CheckCircle2, Bell } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, ErrorState, Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { ENV } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";

interface YearEnd {
  period_label: string;
  period_start: string;
  period_end: string;
  vat_registered: boolean;
  revenue: number;
  other_income: number;
  wages: number;
  expenses: number;
  estimated_profit: number;
  estimated_corporation_tax: number;
  capital_total: number;
  capital_items: Array<{ date: string; label: string | null; amount: number }>;
}

export default function YearEndScreen() {
  const router = useRouter();
  const year = new Date().getFullYear();
  const [data, setData] = useState<YearEnd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [tasks, setTasks] = useState<Array<{ id: string; task_type: string; period_label: string; status: string }>>([]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/bookkeeping/tax-tasks");
      const json = await res.json();
      if (json.success) setTasks(json.tasks);
    } catch { /* non-fatal */ }
  }, []);

  async function markDone(task: { id: string; status: string }) {
    const done = task.status !== "done";
    try {
      await apiFetch(`/api/admin/bookkeeping/tax-tasks/${task.id}/done`, { method: "PATCH", body: JSON.stringify({ done }) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      loadTasks();
    } catch { /* noop */ }
  }

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await apiFetch(`/api/admin/bookkeeping/year-end?year=${year}`);
      const json = await res.json();
      if (json.success) setData(json.yearEnd);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); loadTasks(); }, [load, loadTasks]);

  const TASK_LABEL: Record<string, string> = {
    corporation_tax: "Corporation tax",
    confirmation_statement: "Confirmation statement",
  };

  async function sharePack() {
    setDownloading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uri = FileSystem.cacheDirectory + `year-end-pack-${year}.pdf`;
      const result = await FileSystem.downloadAsync(
        `${ENV.SITE_URL}/api/admin/bookkeeping/year-end/export?year=${year}&format=pdf`,
        uri,
        { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} }
      );
      if (result.status !== 200) throw new Error("Download failed");
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to download pack");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Year-End Tax" onBack={() => router.back()} />
      {loading ? (
        <View style={{ padding: spacing.base, gap: spacing.base }}>
          <Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-24 rounded-xl" />
        </View>
      ) : error || !data ? (
        <ErrorState message="Couldn't load year-end summary." onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.md }}>
          {/* Filing checklist */}
          {tasks.map((t) => {
            const done = t.status === "done";
            return (
              <Card key={t.id} style={{ padding: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: done ? colors.accent.surface : colors.white }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                  {done ? <CheckCircle2 size={20} color={colors.accent.DEFAULT} /> : <Bell size={20} color="#f59e0b" />}
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{TASK_LABEL[t.task_type] ?? t.task_type}</Text>
                    <Text style={[type.bodySmall, { color: colors.slate[500] }]}>{done ? "Done — reminders off" : "Reminders active"}</Text>
                  </View>
                </View>
                <Pressable onPress={() => markDone(t)} style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: done ? colors.slate[100] : colors.accent.DEFAULT }}>
                  <Text style={[type.bodySmall, { color: done ? colors.slate[600] : colors.white, fontWeight: "700" }]}>{done ? "Reopen" : "Mark done"}</Text>
                </Pressable>
              </Card>
            );
          })}

          <Text style={[type.bodySmall, { color: colors.slate[500] }]}>
            {formatDate(data.period_start)} – {formatDate(data.period_end)}{data.vat_registered ? " · ex-VAT" : ""}
          </Text>

          <Card style={{ padding: spacing.lg }}>
            <Row label="Revenue (paid invoices)" value={data.revenue} />
            <Row label="Other income" value={data.other_income} />
            <Row label="Less: wages" value={-data.wages} />
            <Row label="Less: expenses" value={-data.expenses} />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.slate[200], marginVertical: spacing.sm }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>Estimated profit</Text>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{formatCurrency(data.estimated_profit)}</Text>
            </View>
            <View style={{ marginTop: spacing.sm, backgroundColor: colors.primary.surface, borderRadius: 12, padding: spacing.base, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>Est. corporation tax</Text>
              <Text style={[type.display, { fontSize: 24, color: colors.primary.DEFAULT }]}>{formatCurrency(data.estimated_corporation_tax)}</Text>
            </View>
          </Card>

          {data.capital_items.length > 0 && (
            <Card style={{ padding: spacing.base, backgroundColor: "#fffbeb" }}>
              <Text style={[type.bodySemiBold, { color: "#92400e" }]}>Capital purchases — {formatCurrency(data.capital_total)}</Text>
              <Text style={[type.bodySmall, { color: "#92400e", marginTop: 2 }]}>Excluded from profit; your accountant applies capital allowances.</Text>
            </Card>
          )}

          <Button label={downloading ? "Preparing…" : "Share pack (PDF)"} loading={downloading} icon={<Download size={18} color={colors.white} />} onPress={sharePack} />

          <Card style={{ padding: spacing.base, flexDirection: "row", gap: spacing.sm }}>
            <Info size={18} color={colors.slate[400]} />
            <Text style={[type.bodySmall, { color: colors.slate[600], flex: 1 }]}>
              Estimate only — your accountant applies capital allowances, disallowable items and accruals, and files the CT600.
            </Text>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>{label}</Text>
      <Text style={[type.bodySmall, { color: value < 0 ? colors.danger.DEFAULT : colors.slate[900], fontWeight: "600" }]}>{formatCurrency(value)}</Text>
    </View>
  );
}
