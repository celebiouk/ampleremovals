import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { CheckCheck, Download, FileText } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, ErrorState, Button, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { ENV } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payslip = any;
interface RunData { run: { reference: string; period_no: number; pay_date: string; status: string; payslips: Payslip[] }; totals: { gross: number; tax: number; ee_ni: number; net: number; employer_cost: number }; }

export default function PayeRunDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await apiFetch(`/api/admin/paye/pay-runs/${id}`);
      const json = await res.json();
      if (json.success) setData(json); else setError(true);
    } catch { setError(true); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function share(path: string, filename: string, mime: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uri = FileSystem.cacheDirectory + filename;
      const result = await FileSystem.downloadAsync(`${ENV.SITE_URL}${path}`, uri, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (result.status !== 200) throw new Error("Download failed");
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: mime });
    } catch (e) { Alert.alert("Error", e instanceof Error ? e.message : "Failed to download"); }
  }

  async function payAll() {
    const yes = await new Promise<boolean>((r) =>
      Alert.alert("Mark paid", "Mark this whole run as paid?", [
        { text: "Cancel", style: "cancel", onPress: () => r(false) },
        { text: "Confirm", onPress: () => r(true) },
      ]));
    if (!yes) return;
    setPaying(true);
    try { await apiFetch(`/api/admin/paye/pay-runs/${id}/pay`, { method: "PATCH" }); load(); }
    catch { Alert.alert("Error", "Failed"); } finally { setPaying(false); }
  }

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}><ScreenHeader title="Pay run" onBack={() => router.back()} /><View style={{ padding: spacing.base, gap: spacing.base }}><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-40 rounded-xl" /></View></SafeAreaView>;
  if (error || !data) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}><ScreenHeader title="Pay run" onBack={() => router.back()} /><ErrorState message="Couldn't load." onRetry={load} /></SafeAreaView>;

  const { run, totals } = data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title={run.reference} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.md }} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary.DEFAULT} />}>
        <Text style={[type.bodySmall, { color: colors.slate[500] }]}>Week {run.period_no} · paid {new Date(run.pay_date).toLocaleDateString("en-GB")}</Text>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <StatCard icon="Wallet" label="Net pay" value={formatCurrency(totals.net)} variant="accent" style={{ flex: 1 }} />
          <StatCard icon="Banknote" label="Total cost" value={formatCurrency(totals.employer_cost)} variant="primary" style={{ flex: 1 }} />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button label="RTI figures" variant="outline" size="md" icon={<Download size={16} color={colors.primary.DEFAULT} />} onPress={() => share(`/api/admin/paye/pay-runs/${id}/rti`, `rti-${run.reference}.csv`, "text/csv")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={run.status === "paid" ? "Paid" : "Mark paid"} variant="accent" size="md" loading={paying} disabled={run.status === "paid"} icon={<CheckCheck size={16} color={colors.white} />} onPress={payAll} />
          </View>
        </View>

        <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.sm }]}>Payslips ({run.payslips.length})</Text>
        {run.payslips.map((p: Payslip) => (
          <Card key={p.id} style={{ padding: spacing.base }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{p.employee_name}{p.is_director ? "  · dir" : ""}</Text>
                <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: 2 }]}>
                  Gross {formatCurrency(p.gross_pay)} · Tax {formatCurrency(p.income_tax)} · NI {formatCurrency(p.employee_ni)}
                </Text>
              </View>
              <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT, marginRight: spacing.md }]}>{formatCurrency(p.net_pay)}</Text>
              <Pressable onPress={() => share(`/api/admin/paye/payslips/${p.id}/pdf`, `payslip-${p.id}.pdf`, "application/pdf")} hitSlop={8}>
                <FileText size={20} color={colors.primary.DEFAULT} />
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
