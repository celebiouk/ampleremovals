import { useEffect, useState } from "react";
import { ScrollView, View, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AlertTriangle, CheckCircle2 } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, ErrorState, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface Issue {
  payslip_id: string;
  worker_id: string;
  worker_type: string;
  worker_name?: string;
  net_pay: number;
  problems: string[];
}

interface Reconciliation {
  total_paid_payslips: number;
  total_paid_amount: number;
  issue_count: number;
  issues: Issue[];
}

export default function ReconciliationScreen() {
  const router = useRouter();
  const [data, setData] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await apiFetch("/api/admin/payroll/reconciliation");
      const json = await res.json();
      if (json.success) setData(json.reconciliation);
    } catch (e) {
      console.error("Failed to load reconciliation:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 90, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Reconciliation" onBack={() => router.back()} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
        >
          <ErrorState message="No reconciliation data" onRetry={onRefresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Reconciliation" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard icon="FileText" label="Paid payslips" value={String(data.total_paid_payslips)} variant="primary" style={{ flex: 1 }} />
            <StatCard icon="Wallet" label="Total paid" value={formatCurrency(data.total_paid_amount)} variant="accent" style={{ flex: 1 }} />
          </View>
          <StatCard
            icon="AlertTriangle"
            label="Issues found"
            value={String(data.issue_count)}
            variant={data.issue_count > 0 ? "primary" : "accent"}
          />
        </Animated.View>

        {data.issue_count === 0 ? (
          <Card style={{ padding: spacing.lg, alignItems: "center", backgroundColor: colors.accent.surface }}>
            <CheckCircle2 size={40} color={colors.accent.DEFAULT} />
            <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT, marginTop: spacing.sm }]}>
              All payments reconciled
            </Text>
            <Text style={[type.bodySmall, { color: colors.slate[600], textAlign: "center", marginTop: spacing.xs }]}>
              Every paid payslip is internally consistent.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.md }}>
            {data.issues.map((issue) => (
              <Card key={issue.payslip_id} style={{ padding: spacing.base, backgroundColor: "#fffbeb" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flexDirection: "row", gap: spacing.sm, flex: 1 }}>
                    <AlertTriangle size={20} color="#d97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                        {issue.worker_name ?? `${issue.worker_type} ${issue.worker_id.slice(0, 8)}`}
                      </Text>
                      {issue.problems.map((p, i) => (
                        <Text key={i} style={[type.bodySmall, { color: "#92400e", marginTop: spacing.xs }]}>
                          • {p}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>
                    {formatCurrency(issue.net_pay)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
