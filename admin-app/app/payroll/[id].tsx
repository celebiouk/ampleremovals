import { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Download, CheckCheck, Lock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Badge, Skeleton, ErrorState, Button, ScreenHeader, StatCard } from "@/components/ui";
import { usePayRunDetail } from "@/hooks/usePayRunDetail";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";
import Alert from "@react-native-menu/menu";

export default function PayRunDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const qc = useQueryClient();
  const runId = id as string;

  const { data, isLoading, isError, refetch, isRefetching } = usePayRunDetail(runId);
  const [paying, setPaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [finalising, setFinalising] = useState(false);

  const run = data?.data?.run;
  const totals = data?.data?.totals;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["payRunDetail", runId] });
  }

  async function finaliseRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const yes = await new Promise<boolean>((resolve) => {
      const { Alert: NativeAlert } = require("react-native");
      NativeAlert.alert("Finalise pay run?", "Lock this run and prevent further changes.", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirm", style: "default", onPress: () => resolve(true) },
      ]);
    });
    if (!yes) return;

    setFinalising(true);
    try {
      await apiFetch(`/api/admin/pay-runs/${runId}/finalise`, {
        method: "PATCH",
      });
      refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setFinalising(false);
    }
  }

  async function payAll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const yes = await new Promise<boolean>((resolve) => {
      // Use Alert from the native Alert API
      const { Alert: NativeAlert } = require("react-native");
      NativeAlert.alert("Pay all payslips?", "Mark all payslips in this run as paid.", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirm", style: "default", onPress: () => resolve(true) },
      ]);
    });
    if (!yes) return;

    setPaying(true);
    try {
      await apiFetch(`/api/admin/pay-runs/${runId}/pay-all`, {
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

  async function exportCSV() {
    setExporting(true);
    try {
      const response = await apiFetch(`/api/admin/pay-runs/${runId}/export`, { method: "GET" });
      const csv = await response.text();
      const uri = FileSystem.cacheDirectory + `payroll-${run?.reference}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "text/csv" });
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setExporting(false);
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

  if (isError || !run || !totals) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Pay run" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
        >
          <ErrorState message="Failed to load pay run" onRetry={refresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title={run.reference} onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Period info */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm }]}>
            {new Date(run.period_start).toLocaleDateString("en-GB")} –{" "}
            {new Date(run.period_end).toLocaleDateString("en-GB")}
          </Text>
        </Animated.View>

        {/* Totals grid (2x2) */}
        <View style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="Banknote"
              label="Gross"
              value={formatCurrency(totals.gross)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="Gift"
              label="Tips"
              value={formatCurrency(totals.tips)}
              variant="accent"
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="Settings"
              label="Adjustments"
              value={formatCurrency(totals.adjustments)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="Wallet"
              label="Net"
              value={formatCurrency(totals.net)}
              variant="accent"
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          {run.status === "draft" && (
            <Button
              label="Finalise Pay Run"
              variant="outline"
              size="md"
              loading={finalising}
              icon={<Lock size={18} color={colors.primary.DEFAULT} />}
              onPress={finaliseRun}
            />
          )}
          <Button
            label="Export CSV"
            variant="outline"
            size="md"
            loading={exporting}
            icon={<Download size={18} color={colors.primary.DEFAULT} />}
            onPress={exportCSV}
          />
          <Button
            label={`Pay all (${totals.pending})`}
            variant="accent"
            size="md"
            loading={paying}
            disabled={totals.pending === 0}
            icon={<CheckCheck size={18} color={colors.white} />}
            onPress={payAll}
          />
        </View>

        {/* Payslips list */}
        <View>
          <Text style={[type.h3, { color: colors.slate[900], marginBottom: spacing.base }]}>
            {run.payslips?.length ?? 0} Payslip{(run.payslips?.length ?? 0) !== 1 ? "s" : ""}
          </Text>
          <FlatList
            scrollEnabled={false}
            data={run.payslips}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item: ps }) => (
              <Animated.View entering={FadeInDown.springify()}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    router.push(`/payslip/${ps.id}`);
                  }}
                >
                  <Card style={{ padding: spacing.base }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                          {ps.worker_name ?? (ps.worker_type === "driver" ? "Driver" : "Cleaner")}
                        </Text>
                        <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                          Gross: {formatCurrency(ps.gross_earnings)}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[type.h3, { color: colors.primary.DEFAULT, marginBottom: spacing.xs }]}>
                          {formatCurrency(ps.net_pay)}
                        </Text>
                        <Badge
                          label={ps.status}
                          variant={ps.status === "paid" ? "success" : "warning"}
                        />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
