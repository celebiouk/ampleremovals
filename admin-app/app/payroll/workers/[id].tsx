import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Download } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, StatCard, Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { ENV } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface WorkerReport {
  payslip_count: number;
  paid_count: number;
  pending_count: number;
  total_gross: number;
  total_tips: number;
  total_net: number;
  average_payslip: number;
  estimated_tax: number;
  estimated_ni: number;
  estimated_total_deductions: number;
  monthly_breakdown: Record<string, { gross: number; net: number; count: number }>;
  payslips: Array<{
    id: string;
    gross_earnings: number;
    tips_total: number;
    net_pay: number;
    status: string;
    created_at: string;
    pay_runs: { reference: string };
  }>;
}

export default function WorkerReportScreen() {
  const router = useRouter();
  const { id: workerId } = useLocalSearchParams();
  const [report, setReport] = useState<WorkerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  async function downloadP45() {
    setDownloading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uri = FileSystem.cacheDirectory + `year-end-${workerId}.pdf`;
      const result = await FileSystem.downloadAsync(
        `${ENV.SITE_URL}/api/admin/payroll/workers/${workerId}/p45`,
        uri,
        { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} }
      );
      if (result.status !== 200) throw new Error("Download failed");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const { Alert } = require("react-native");
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await apiFetch(
          `/api/admin/payroll/workers/${workerId}/report`
        );
        const data = await response.json();
        if (data.success && data.report) {
          setReport(data.report);
        }
      } catch (e) {
        console.error("Failed to fetch worker report:", e);
      } finally {
        setLoading(false);
      }
    };

    if (workerId) fetchReport();
  }, [workerId]);

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

  if (!report) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Worker Report" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Worker Earnings" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Year-end PDF */}
        <View style={{ marginBottom: spacing.lg }}>
          <Button
            label="Download year-end PDF"
            variant="outline"
            size="md"
            loading={downloading}
            icon={<Download size={18} color={colors.primary.DEFAULT} />}
            onPress={downloadP45}
          />
        </View>

        {/* Summary */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="FileText"
              label="Payslips"
              value={String(report.payslip_count)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="TrendingUp"
              label="Total Gross"
              value={formatCurrency(report.total_gross)}
              variant="accent"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Tax info */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
            <Text style={[type.bodySmall, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>
              Tax & Compliance
            </Text>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>Income Tax (est.)</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  {formatCurrency(report.estimated_tax)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>National Insurance (est.)</Text>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  {formatCurrency(report.estimated_ni)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingTop: spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: colors.primary.light,
                }}
              >
                <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>Total Deductions</Text>
                <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>
                  {formatCurrency(report.estimated_total_deductions)}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Monthly breakdown */}
        {Object.keys(report.monthly_breakdown).length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Monthly Breakdown
            </Text>
            <FlatList
              scrollEnabled={false}
              data={Object.entries(report.monthly_breakdown)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, data]) => ({ month, ...data }))}
              keyExtractor={(item) => item.month}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item }) => (
                <Card style={{ padding: spacing.base }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{item.month}</Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600] }]}>{item.count} payslips</Text>
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

        {/* Payslips */}
        {report.payslips.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Payslips ({report.payslips.length})
            </Text>
            <FlatList
              scrollEnabled={false}
              data={report.payslips}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item }) => (
                <Card style={{ padding: spacing.base }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {item.pay_runs.reference}
                    </Text>
                    <Text
                      style={[
                        type.bodySmall,
                        {
                          color: item.status === "paid" ? colors.accent.DEFAULT : colors.primary.DEFAULT,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm }]}>
                    {new Date(item.created_at).toLocaleDateString("en-GB")}
                  </Text>
                  <View style={{ flexDirection: "row", gap: spacing.lg }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Gross</Text>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                        {formatCurrency(item.gross_earnings)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Net</Text>
                      <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT, marginTop: spacing.xs }]}>
                        {formatCurrency(item.net_pay)}
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
