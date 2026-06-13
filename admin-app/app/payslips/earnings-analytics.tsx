import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface EarningsAnalytics {
  year: number;
  ytd_gross: number;
  ytd_tips: number;
  ytd_net: number;
  payslip_count: number;
  paid_count: number;
  pending_count: number;
  average_gross: number;
  average_net: number;
  best_month: { month: string; gross: number } | null;
  worst_month: { month: string; gross: number } | null;
  trend_percentage: number;
  monthly_breakdown: Record<string, { gross: number; net: number; count: number }>;
}

export default function EarningsAnalyticsScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<EarningsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiFetch("/api/worker/earnings/analytics");
        const data = await response.json();

        if (data.success) {
          setAnalytics(data.earnings_analytics);
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
        <ScreenHeader title="Earnings Analytics" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No earnings data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const monthlyEntries = Object.entries(analytics.monthly_breakdown).sort(
    ([a], [b]) => b.localeCompare(a)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title={`Analytics ${analytics.year}`} onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Card
            style={{
              padding: spacing.base,
              backgroundColor: colors.primary.DEFAULT,
            }}
          >
            <Text style={[type.bodySmall, { color: colors.primary.light }]}>
              Year to Date
            </Text>
            <Text style={[type.display, { color: colors.white, fontSize: 32, fontWeight: "bold", marginTop: spacing.sm }]}>
              {formatCurrency(analytics.ytd_gross)}
            </Text>
            <Text style={[type.bodySmall, { color: colors.primary.light, marginTop: spacing.xs }]}>
              {analytics.payslip_count} payslips • {analytics.paid_count} paid
            </Text>
          </Card>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="Banknote"
              label="Avg per Slip"
              value={formatCurrency(analytics.average_gross)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="TrendingUp"
              label="Trend"
              value={`${Math.abs(analytics.trend_percentage).toFixed(1)}%`}
              variant={analytics.trend_percentage >= 0 ? "accent" : "primary"}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Best & Worst */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            {analytics.best_month && (
              <Card style={{ flex: 1, padding: spacing.base, backgroundColor: colors.accent.surface }}>
                <Text style={[type.bodySmall, { color: colors.accent.DEFAULT }]}>Best Month</Text>
                <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT, marginTop: spacing.sm }]}>
                  {analytics.best_month.month}
                </Text>
                <Text style={[type.h3, { color: colors.accent.DEFAULT, marginTop: spacing.xs }]}>
                  {formatCurrency(analytics.best_month.gross)}
                </Text>
              </Card>
            )}
            {analytics.worst_month && (
              <Card style={{ flex: 1, padding: spacing.base, backgroundColor: colors.primary.surface }}>
                <Text style={[type.bodySmall, { color: colors.primary.DEFAULT }]}>Lowest Month</Text>
                <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT, marginTop: spacing.sm }]}>
                  {analytics.worst_month.month}
                </Text>
                <Text style={[type.h3, { color: colors.primary.DEFAULT, marginTop: spacing.xs }]}>
                  {formatCurrency(analytics.worst_month.gross)}
                </Text>
              </Card>
            )}
          </View>
        </Animated.View>

        {/* Monthly breakdown */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Monthly Breakdown
          </Text>
          <FlatList
            scrollEnabled={false}
            data={monthlyEntries}
            keyExtractor={(item) => item[0]}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item: [month, data] }) => (
              <Card style={{ padding: spacing.base }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{month}</Text>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>{data.count} payslips</Text>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.lg }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Gross</Text>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                      {formatCurrency(data.gross)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Net</Text>
                    <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT, marginTop: spacing.xs }]}>
                      {formatCurrency(data.net)}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
