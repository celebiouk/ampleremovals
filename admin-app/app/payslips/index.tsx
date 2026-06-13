import { useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Calendar, DollarSign, Settings, TrendingUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Badge, Skeleton, ErrorState, ScreenHeader, StatCard } from "@/components/ui";
import { usePayslips } from "@/hooks/usePayslips";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

export default function PayslipsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = usePayslips();

  const payslips = data?.payslips || [];
  const totals = data?.totals || { paid: 0, pending: 0, total: 0 };

  function refresh() {
    qc.invalidateQueries({ queryKey: ["worker-payslips"] });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="My Payslips" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 100, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="My Payslips" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
        >
          <ErrorState message="Failed to load payslips" onRetry={refresh} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader
        title="My Payslips"
        right={
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push("/payslips/settings");
            }}
            style={{ padding: spacing.sm }}
          >
            <Settings size={24} color={colors.primary.DEFAULT} />
          </Pressable>
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.base }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Totals */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="Banknote"
              label="Paid"
              value={formatCurrency(totals.paid)}
              variant="accent"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="Clock"
              label="Pending"
              value={formatCurrency(totals.pending)}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push("/payslips/earnings-summary");
            }}
            style={{
              paddingHorizontal: spacing.base,
              paddingVertical: spacing.base,
              borderRadius: 12,
              backgroundColor: colors.slate[100],
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <TrendingUp size={18} color={colors.primary.DEFAULT} />
            <Text style={[type.body, { color: colors.primary.DEFAULT, fontWeight: "600", flex: 1 }]}>
              View Earnings Summary
            </Text>
          </Pressable>
        </Animated.View>

        {/* Payslips list */}
        {payslips.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={{ alignItems: "center", marginTop: spacing.xl }}>
            <DollarSign size={48} color={colors.slate[300]} />
            <Text style={[type.h3, { color: colors.slate[600], marginTop: spacing.lg, textAlign: "center" }]}>
              No payslips yet
            </Text>
            <Text style={[type.body, { color: colors.slate[500], marginTop: spacing.sm, textAlign: "center" }]}>
              Your payslips will appear here
            </Text>
          </Animated.View>
        ) : (
          <View>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              {payslips.length} Payslip{payslips.length !== 1 ? "s" : ""}
            </Text>
            <FlatList
              scrollEnabled={false}
              data={payslips}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item: ps }) => (
                <Animated.View entering={FadeInDown.springify()}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      router.push(`/payslips/${ps.id}`);
                    }}
                  >
                    <Card style={{ padding: spacing.base }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                            {ps.pay_run?.reference || "Payslip"}
                          </Text>
                          <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                            {new Date(ps.created_at).toLocaleDateString("en-GB", {
                              month: "short",
                              year: "numeric",
                            })}
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
