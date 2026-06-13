import { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AlertCircle, TrendingDown } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface TaxSummary {
  year: number;
  ytd_gross: number;
  ytd_tips: number;
  ytd_net: number;
  payslip_count: number;
  estimated_tax: number;
  estimated_ni: number;
  estimated_total_deductions: number;
  tax_threshold: number;
  ni_threshold: number;
}

export default function TaxSummaryScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await apiFetch("/api/worker/tax-summary");
        const data = await response.json();
        if (data.success) {
          setSummary(data.tax_summary);
        }
      } catch (e) {
        console.error("Failed to fetch tax summary:", e);
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
        <ScreenHeader title="Tax Summary" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title={`Tax Summary ${summary.year}`} onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* YTD Earnings */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
            <Text style={[type.bodySmall, { color: colors.primary.DEFAULT }]}>Year to Date</Text>
            <Text style={[type.display, { color: colors.primary.DEFAULT, fontSize: 32, fontWeight: "bold", marginTop: spacing.sm }]}>
              {formatCurrency(summary.ytd_gross)}
            </Text>
            <Text style={[type.bodySmall, { color: colors.primary.light, marginTop: spacing.sm }]}>
              {summary.payslip_count} payslips
            </Text>
          </Card>
        </Animated.View>

        {/* Breakdown */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base }}>
            <View style={{ marginBottom: spacing.base, paddingBottom: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>Gross Earnings</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  {formatCurrency(summary.ytd_gross)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>Tips</Text>
                <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT }]}>
                  {formatCurrency(summary.ytd_tips)}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: spacing.base, paddingBottom: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
              <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.sm }]}>Deductions</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>Income Tax (est.)</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>
                  {formatCurrency(summary.estimated_tax)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>National Insurance (est.)</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>
                  {formatCurrency(summary.estimated_ni)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[type.h3, { color: colors.slate[900] }]}>Estimated Net</Text>
              <Text style={[type.h3, { color: colors.accent.DEFAULT }]}>
                {formatCurrency(summary.ytd_net)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Info notice */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.slate[50], flexDirection: "row", gap: spacing.base }}>
            <AlertCircle size={20} color={colors.slate[600]} />
            <Text style={[type.bodySmall, { color: colors.slate[600], flex: 1 }]}>
              Estimates based on 2024/25 thresholds. Your actual tax may vary based on personal circumstances.
            </Text>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
