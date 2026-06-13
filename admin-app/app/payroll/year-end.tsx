import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TrendingUp, Calendar } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface YearEndSummary {
  year: number;
  total_payslips: number;
  total_gross: number;
  total_tips: number;
  total_net: number;
  estimated_tax: number;
  estimated_ni: number;
  total_deductions: number;
  net_after_tax: number;
  worker_breakdown: {
    drivers: { payslips: number; gross: number };
    cleaners: { payslips: number; gross: number };
  };
  top_earning_months: Array<{ month: string; gross: number; net: number }>;
  monthly_distribution: Record<string, { gross: number; net: number; count: number }>;
}

export default function YearEndScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<YearEndSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await apiFetch("/api/admin/payroll/year-end");
        const data = await response.json();
        if (data.success) {
          setSummary(data.year_end_summary);
        }
      } catch (e) {
        console.error("Failed to fetch year-end:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
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

  if (!summary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Year-End" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const monthlyData = Object.entries(summary.monthly_distribution)
    .sort(([a], [b]) => {
      const aDate = new Date(`01 ${a}`);
      const bDate = new Date(`01 ${b}`);
      return bDate.getTime() - aDate.getTime();
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title={`Year-End ${summary.year}`} onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Hero card */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Card
            style={{
              padding: spacing.base,
              backgroundColor: colors.primary.DEFAULT,
            }}
          >
            <Text style={[type.bodySmall, { color: colors.primary.light, marginBottom: spacing.xs }]}>
              Total Payroll {summary.year}
            </Text>
            <Text style={[type.display, { color: colors.white, fontSize: 28, fontWeight: "bold", marginBottom: spacing.sm }]}>
              {formatCurrency(summary.total_gross)}
            </Text>
            <Text style={[type.bodySmall, { color: colors.primary.light }]}>
              {summary.total_payslips} payslips • {formatCurrency(summary.total_net)} net
            </Text>
          </Card>
        </Animated.View>

        {/* Key metrics */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="TrendingUp"
              label="Net After Tax"
              value={formatCurrency(summary.net_after_tax)}
              variant="accent"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="AlertTriangle"
              label="Deductions"
              value={formatCurrency(summary.total_deductions)}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Tax breakdown */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.slate[50] }}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Tax Breakdown
            </Text>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>Income Tax</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  {formatCurrency(summary.estimated_tax)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>National Insurance</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  {formatCurrency(summary.estimated_ni)}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Worker breakdown */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Worker Types
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card style={{ flex: 1, padding: spacing.base, backgroundColor: colors.primary.surface }}>
              <Text style={[type.bodySmall, { color: colors.primary.DEFAULT, marginBottom: spacing.xs }]}>
                Drivers
              </Text>
              <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>
                {summary.worker_breakdown.drivers.payslips}
              </Text>
              <Text style={[type.bodySmall, { color: colors.primary.light, marginTop: spacing.xs }]}>
                {formatCurrency(summary.worker_breakdown.drivers.gross)}
              </Text>
            </Card>
            <Card style={{ flex: 1, padding: spacing.base, backgroundColor: colors.accent.surface }}>
              <Text style={[type.bodySmall, { color: colors.accent.DEFAULT, marginBottom: spacing.xs }]}>
                Cleaners
              </Text>
              <Text style={[type.h3, { color: colors.accent.DEFAULT }]}>
                {summary.worker_breakdown.cleaners.payslips}
              </Text>
              <Text style={[type.bodySmall, { color: colors.accent.light, marginTop: spacing.xs }]}>
                {formatCurrency(summary.worker_breakdown.cleaners.gross)}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Top months */}
        {summary.top_earning_months.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).springify()} style={{ marginBottom: spacing.lg }}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Top Earning Months
            </Text>
            <FlatList
              scrollEnabled={false}
              data={summary.top_earning_months}
              keyExtractor={(item) => item.month}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              renderItem={({ item, index }) => (
                <Card style={{ padding: spacing.base }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.base }}>
                      <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>#{index + 1}</Text>
                      <Text style={[type.body, { color: colors.slate[600] }]}>{item.month}</Text>
                    </View>
                    <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT }]}>
                      {formatCurrency(item.net)}
                    </Text>
                  </View>
                </Card>
              )}
            />
          </Animated.View>
        )}

        {/* Monthly table */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            All Months
          </Text>
          <FlatList
            scrollEnabled={false}
            data={monthlyData}
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
