import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, ScreenHeader, Skeleton, StatCard } from "@/components/ui";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface Analytics {
  total_payslips: number;
  total_gross: number;
  total_tips: number;
  total_net_paid: number;
  total_net_pending: number;
  total_pay_runs: number;
  draft_runs: number;
  finalised_runs: number;
  paid_runs: number;
  drivers: number;
  cleaners: number;
  average_payslip: number;
  year: number;
}

export default function PayrollAnalyticsScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [monthly, setMonthly] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiFetch("/api/admin/payroll/analytics");
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
          setMonthly(data.monthly_breakdown);
        }
      } catch (e) {
        console.error("Failed to fetch analytics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 100, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Analytics" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title={`Analytics ${analytics.year}`} onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Key metrics */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="TrendingUp"
              label="Total Paid"
              value={formatCurrency(analytics.total_net_paid)}
              variant="accent"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="Clock"
              label="Pending"
              value={formatCurrency(analytics.total_net_pending)}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Status cards */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.sm }]}>
            Pay Run Status
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card style={{ flex: 1, padding: spacing.base, alignItems: "center" }}>
              <Text style={[type.h3, { color: colors.slate[400] }]}>{analytics.draft_runs}</Text>
              <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.sm }]}>Draft</Text>
            </Card>
            <Card style={{ flex: 1, padding: spacing.base, alignItems: "center" }}>
              <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>{analytics.finalised_runs}</Text>
              <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.sm }]}>Finalised</Text>
            </Card>
            <Card style={{ flex: 1, padding: spacing.base, alignItems: "center" }}>
              <Text style={[type.h3, { color: colors.accent.DEFAULT }]}>{analytics.paid_runs}</Text>
              <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.sm }]}>Paid</Text>
            </Card>
          </View>
        </Animated.View>

        {/* Monthly breakdown */}
        {Object.keys(monthly).length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Monthly Breakdown
            </Text>
            <FlatList
              scrollEnabled={false}
              data={Object.entries(monthly)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, data]) => ({ month, ...data }))}
              keyExtractor={(item) => item.month}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item }) => (
                <Card style={{ padding: spacing.base }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{item.month}</Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600] }]}>
                      {item.count} payslips
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: spacing.lg }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Gross</Text>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                        {formatCurrency(item.gross)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Net</Text>
                      <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT, marginTop: spacing.xs }]}>
                        {formatCurrency(item.net)}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
