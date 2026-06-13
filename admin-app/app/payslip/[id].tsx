import { useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Linking from "expo-linking";
import { Download, CheckCheck } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Badge, Skeleton, ErrorState, Button, ScreenHeader, StatCard } from "@/components/ui";
import { usePayslip } from "@/hooks/usePayslip";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

export default function PayslipDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const qc = useQueryClient();
  const payslipId = id as string;

  const { data, isLoading, isError, refetch, isRefetching } = usePayslip(payslipId);
  const [paying, setPaying] = useState(false);

  const payslip = data?.payslip;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["payslip", payslipId] });
  }

  async function markPaid() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const yes = await new Promise<boolean>((resolve) => {
      const { Alert } = require("react-native");
      Alert.alert("Mark as paid?", "This will update the linked earnings.", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirm", style: "default", onPress: () => resolve(true) },
      ]);
    });
    if (!yes) return;

    setPaying(true);
    try {
      await apiFetch(`/api/admin/payslips/${payslipId}/pay`, {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: "bank_transfer" }),
      });
      refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setPaying(false);
    }
  }

  async function viewPDF() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const url = `/api/admin/payslips/${payslipId}/pdf`;
      await Linking.openURL(url);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }

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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
        >
          <ErrorState message="Failed to load payslip" onRetry={refresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader
        title="Payslip"
        right={
          <Badge
            label={payslip.status}
            variant={payslip.status === "paid" ? "success" : "warning"}
          />
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Worker type */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm }]}>
            {payslip.worker_type === "driver" ? "Driver" : "Cleaner"}
          </Text>
        </Animated.View>

        {/* Totals breakdown */}
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[type.body, { color: colors.slate[600] }]}>Adjustments</Text>
              <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>
                {formatCurrency(payslip.adjustments_total)}
              </Text>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.slate[200],
                paddingTopWidth: spacing.base,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={[type.h3, { color: colors.slate[900] }]}>Net Pay</Text>
              <Text style={[type.display, { color: colors.primary.DEFAULT, fontSize: 28 }]}>
                {formatCurrency(payslip.net_pay)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <Button
            label="View PDF"
            variant="outline"
            size="md"
            icon={<Download size={18} color={colors.primary.DEFAULT} />}
            onPress={viewPDF}
          />
          {payslip.status === "pending" && (
            <Button
              label="Mark as Paid"
              variant="accent"
              size="md"
              loading={paying}
              icon={<CheckCheck size={18} color={colors.white} />}
              onPress={markPaid}
            />
          )}
        </View>

        {/* Adjustments */}
        {payslip.payroll_adjustments && payslip.payroll_adjustments.length > 0 && (
          <View>
            <Text style={[type.h3, { color: colors.slate[900], marginBottom: spacing.base }]}>
              Adjustments
            </Text>
            <FlatList
              scrollEnabled={false}
              data={payslip.payroll_adjustments}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item: adj }) => (
                <Animated.View entering={FadeInDown.springify()}>
                  <Card style={{ padding: spacing.base, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                        {adj.label}
                      </Text>
                      <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs, textTransform: "capitalize" }]}>
                        {adj.type}
                      </Text>
                    </View>
                    <Text
                      style={[
                        type.h3,
                        {
                          color: adj.amount >= 0 ? colors.accent.DEFAULT : colors.danger.DEFAULT,
                        },
                      ]}
                    >
                      {adj.amount >= 0 ? "+" : ""}{formatCurrency(adj.amount)}
                    </Text>
                  </Card>
                </Animated.View>
              )}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
