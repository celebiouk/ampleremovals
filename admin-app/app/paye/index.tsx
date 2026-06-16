import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus, ChevronRight, Info } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, ScreenHeader, Skeleton, EmptyState, ErrorState, Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

// The current UK tax year label (boundary is 6 April). Auto-advances each April.
function currentTaxYear(date: Date = new Date()): string {
  const m = date.getMonth(), day = date.getDate();
  const startYear = m < 3 || (m === 3 && day < 6) ? date.getFullYear() - 1 : date.getFullYear();
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
const CURRENT_TAX_YEAR = currentTaxYear();

function taxWeekFor(d: Date): number {
  const year = d.getMonth() < 3 || (d.getMonth() === 3 && d.getDate() < 6) ? d.getFullYear() - 1 : d.getFullYear();
  const start = new Date(Date.UTC(year, 3, 6));
  const diff = Math.floor((d.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
  return Math.min(52, Math.max(1, diff + 1));
}

interface Run { id: string; reference: string; period_no: number; pay_date: string; status: string; paye_payslips?: { count?: number }[]; }

export default function PayeRunsScreen() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await apiFetch("/api/admin/paye/pay-runs");
      const data = await res.json();
      if (data.success) setRuns(data.runs); else setError(true);
    } catch { setError(true); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function newRun() {
    const today = new Date();
    const week = taxWeekFor(today);
    const yes = await new Promise<boolean>((r) =>
      Alert.alert("New weekly run", `Create a pay run for tax week ${week} (${CURRENT_TAX_YEAR}) and calculate every active employee?`, [
        { text: "Cancel", style: "cancel", onPress: () => r(false) },
        { text: "Create", onPress: () => r(true) },
      ]));
    if (!yes) return;
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const res = await apiFetch("/api/admin/paye/pay-runs", {
        method: "POST",
        body: JSON.stringify({ tax_year: CURRENT_TAX_YEAR, period_no: week, pay_date: today.toISOString().slice(0, 10) }),
      });
      const data = await res.json();
      if (data.success) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); router.push(`/paye/${data.id}` as any); }
      else Alert.alert("Error", data.error || "Failed");
    } catch (e) { Alert.alert("Error", e instanceof Error ? e.message : "Failed"); }
    finally { setCreating(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="PAYE Pay Runs" onBack={() => router.back()} />
      {loading ? (
        <View style={{ padding: spacing.base, gap: spacing.base }}>{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</View>
      ) : error ? (
        <ErrorState message="Couldn't load pay runs." onRetry={load} />
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.base, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary.DEFAULT} />}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
              <Card style={{ padding: spacing.base, flexDirection: "row", gap: spacing.sm, backgroundColor: "#fffbeb" }}>
                <Info size={18} color="#d97706" />
                <Text style={[type.bodySmall, { color: "#92400e", flex: 1 }]}>
                  Parallel-run vs HMRC Basic PAYE Tools before paying real wages; submit RTI (FPS) there each payday.
                </Text>
              </Card>
              <Button label={creating ? "Creating…" : "New weekly run"} loading={creating} icon={<Plus size={16} color={colors.white} />} onPress={newRun} />
            </View>
          }
          ListEmptyComponent={<EmptyState title="No pay runs" message="Add employees on the web, then create a weekly run." />}
          renderItem={({ item: r }) => (
            <Pressable onPress={() => router.push(`/paye/${r.id}` as any)}>
              <Card style={{ padding: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{r.reference}</Text>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Week {r.period_no} · {new Date(r.pay_date).toLocaleDateString("en-GB")} · {r.status}</Text>
                </View>
                <ChevronRight size={18} color="#94a3b8" />
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
