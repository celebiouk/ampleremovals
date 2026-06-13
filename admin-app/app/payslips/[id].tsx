import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Download } from "lucide-react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Card, Badge, Skeleton, ErrorState, Button, ScreenHeader } from "@/components/ui";
import { useWorkerPayslip } from "@/hooks/useWorkerPayslip";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

export default function PayslipDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const payslipId = id as string;

  const { data, isLoading, isError, refetch } = useWorkerPayslip(payslipId);
  const payslip = data?.payslip;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 100, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !payslip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Payslip" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          <ErrorState message="Failed to load payslip" onRetry={refetch} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  async function downloadPDF() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const url = `/api/worker/payslips/${payslipId}/pdf`;
      await Linking.openURL(url);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader
        title={payslip.pay_run?.reference || "Payslip"}
        right={
          <Badge
            label={payslip.status}
            variant={payslip.status === "paid" ? "success" : "warning"}
          />
        }
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Period info */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm }]}>
            {new Date(payslip.pay_run?.period_start).toLocaleDateString("en-GB")} –{" "}
            {new Date(payslip.pay_run?.period_end).toLocaleDateString("en-GB")}
          </Text>
        </Animated.View>

        {/* Payment breakdown */}
        <Card style={{ padding: spacing.base, marginBottom: spacing.lg }}>
          <View style={{ gap: spacing.base }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[type.body, { color: colors.slate[600] }]}>Gross Earnings</Text>
              <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>
                {formatCurrency(payslip.gross_earnings)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[type.body, { color: colors.slate[600] }]}>Tips</Text>
              <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>
                {formatCurrency(payslip.tips_total)}
              </Text>
            </View>
            {payslip.adjustments_total !== 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: colors.slate[600] }]}>Adjustments</Text>
                <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>
                  {formatCurrency(payslip.adjustments_total)}
                </Text>
              </View>
            )}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.slate[200],
                paddingTopWidth: spacing.base,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: spacing.base,
              }}
            >
              <Text style={[type.h3, { color: colors.slate[900] }]}>Net Pay</Text>
              <Text style={[type.display, { color: colors.primary.DEFAULT, fontSize: 28 }]}>
                {formatCurrency(payslip.net_pay)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Payment status */}
        <Card style={{ padding: spacing.base, backgroundColor: colors.slate[50], marginBottom: spacing.lg }}>
          <Text style={[type.bodySmall, { color: colors.slate[600], fontWeight: "600" }]}>Payment Status</Text>
          <Text style={[type.h3, { color: payslip.status === "paid" ? colors.accent.DEFAULT : colors.primary.DEFAULT, marginTop: spacing.sm }]}>
            {payslip.status === "paid" ? "✓ Paid" : "Pending"}
          </Text>
          {payslip.paid_at && (
            <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.sm }]}>
              {new Date(payslip.paid_at).toLocaleDateString("en-GB")}
            </Text>
          )}
        </Card>

        {/* Download PDF */}
        <Button
          label="Download PDF"
          variant="outline"
          size="lg"
          icon={<Download size={20} color={colors.primary.DEFAULT} />}
          onPress={downloadPDF}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
