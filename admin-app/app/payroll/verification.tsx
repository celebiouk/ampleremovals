import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CheckCircle2, TrendingUp, Download } from "lucide-react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Card, ScreenHeader, Skeleton, ErrorState, StatCard, Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface PaymentVerification {
  total_paid: number;
  total_payslips: number;
  payment_methods: Array<{
    method: string;
    count: number;
    total: number;
    avg: number;
  }>;
  recent_payments: Array<{
    id: string;
    worker_type: string;
    net_pay: number;
    payment_method: string;
    paid_at: string;
  }>;
}

export default function PaymentVerificationScreen() {
  const router = useRouter();
  const [verification, setVerification] = useState<PaymentVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchVerification = async () => {
    try {
      const response = await apiFetch("/api/admin/payslips/verification");
      const data = await response.json();
      if (data.success) {
        setVerification(data.verification);
      }
    } catch (e) {
      console.error("Failed to fetch verification:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVerification();
  };

  const exportCSV = async (type: "payslips" | "compliance" = "payslips") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setExporting(true);
    try {
      const response = await apiFetch(`/api/admin/payroll/export/csv?type=${type}`, {
        method: "GET",
      });
      const csv = await response.text();
      const uri = FileSystem.cacheDirectory + `payroll-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "text/csv" });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setExporting(false);
    }
  };

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

  if (!verification) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Payment Verification" onBack={() => router.back()} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
        >
          <ErrorState message="No verification data available" onRetry={onRefresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Payment Verification" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Summary */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="Wallet"
              label="Total Paid"
              value={formatCurrency(verification.total_paid)}
              variant="accent"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="FileText"
              label="Payslips"
              value={String(verification.total_payslips)}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Export buttons */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Button
              label="Export Payslips"
              variant="outline"
              size="md"
              loading={exporting}
              icon={<Download size={18} color={colors.primary.DEFAULT} />}
              onPress={() => exportCSV("payslips")}
              style={{ flex: 1 }}
            />
            <Button
              label="Export Compliance"
              variant="outline"
              size="md"
              loading={exporting}
              icon={<Download size={18} color={colors.primary.DEFAULT} />}
              onPress={() => exportCSV("compliance")}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Payment methods */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Payment Methods
          </Text>
          <FlatList
            scrollEnabled={false}
            data={verification.payment_methods}
            keyExtractor={(item) => item.method}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item: method }) => (
              <Card style={{ padding: spacing.base }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                  <View>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900], textTransform: "capitalize" }]}>
                      {method.method.replace("_", " ")}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                      {method.count} payslips
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {formatCurrency(method.total)}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                      avg {formatCurrency(method.avg)}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          />
        </Animated.View>

        {/* Recent payments */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Recent Payments ({verification.recent_payments.length})
          </Text>
          <FlatList
            scrollEnabled={false}
            data={verification.recent_payments}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item: payment }) => (
              <Card style={{ padding: spacing.base }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {new Date(payment.paid_at).toLocaleDateString("en-GB")}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs, textTransform: "capitalize" }]}>
                      {payment.worker_type}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT }]}>
                      {formatCurrency(payment.net_pay)}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs, textTransform: "capitalize" }]}>
                      {payment.payment_method?.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <CheckCircle2 size={16} color={colors.accent.DEFAULT} />
                  <Text style={[type.bodySmall, { color: colors.accent.DEFAULT }]}>Confirmed</Text>
                </View>
              </Card>
            )}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
