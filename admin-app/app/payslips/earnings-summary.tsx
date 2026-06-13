import { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TrendingUp } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface Summary {
  total_payslips: number;
  total_gross: number;
  total_tips: number;
  total_net_paid: number;
  total_net_pending: number;
  average_payslip: number;
  recent_payslips: Array<{ month: string; net_pay: number }>;
}

export default function EarningsSummaryScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await apiFetch("/api/worker/earnings/summary");
        const data = await response.json();
        if (data.success) {
          setSummary(data.summary);
        }
      } catch (e) {
        console.error("Failed to fetch earnings summary:", e);
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
        <ScreenHeader title="Earnings Summary" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Earnings Summary" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Overall stats */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
            <Text style={[type.bodySmall, { color: colors.primary.DEFAULT }]}>Total Earned</Text>
            <Text style={[type.display, { color: colors.primary.DEFAULT, fontSize: 32, fontWeight: "bold", marginTop: spacing.sm }]}>
              {formatCurrency(summary.total_net_paid)}
            </Text>
            <Text style={[type.bodySmall, { color: colors.primary.light, marginTop: spacing.sm }]}>
              Across {summary.total_payslips} payslips
            </Text>
          </Card>
        </Animated.View>

        {/* Stats grid */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card style={{ padding: spacing.base, flex: 1 }}>
              <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Average</Text>
              <Text style={[type.h3, { color: colors.primary.DEFAULT, marginTop: spacing.sm }]}>
                {formatCurrency(summary.average_payslip)}
              </Text>
            </Card>
            <Card style={{ padding: spacing.base, flex: 1 }}>
              <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Tips</Text>
              <Text style={[type.h3, { color: colors.accent.DEFAULT, marginTop: spacing.sm }]}>
                {formatCurrency(summary.total_tips)}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Recent payslips trend */}
        {summary.recent_payslips.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.base }}>
                <TrendingUp size={20} color={colors.primary.DEFAULT} />
                <Text style={[type.bodySemiBold, { color: colors.slate[900], marginLeft: spacing.sm }]}>
                  Recent Payslips
                </Text>
              </View>
              {summary.recent_payslips.map((ps, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm }}>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>{ps.month}</Text>
                  <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>
                    {formatCurrency(ps.net_pay)}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
