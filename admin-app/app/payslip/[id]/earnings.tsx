import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Card, ScreenHeader, Skeleton, ErrorState } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface Earning {
  id: string;
  booking_id: string;
  booking_reference?: string;
  booking_date?: string;
  gross_earnings: number;
  tip_amount: number;
  total: number;
}

export default function EarningsBreakdownScreen() {
  const { id } = useLocalSearchParams();
  const payslipId = id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["payslip-earnings", payslipId],
    queryFn: async () => {
      const response = await apiFetch(`/api/admin/payslips/${payslipId}/earnings`);
      return response.json();
    },
  });

  const earnings = data?.earnings || [];
  const totals = data?.totals || { gross: 0, tips: 0, total: 0 };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ marginBottom: spacing.base, height: 80, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Earnings breakdown" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
          <ErrorState message="Failed to load earnings" onRetry={refetch} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Earnings breakdown" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Totals summary */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.base }}>
              <Text style={[type.bodySmall, { color: colors.primary.DEFAULT }]}>Gross</Text>
              <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>{formatCurrency(totals.gross)}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[type.bodySmall, { color: colors.primary.DEFAULT }]}>Tips</Text>
              <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>{formatCurrency(totals.tips)}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Earnings list */}
        <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
          {earnings.length} Job{earnings.length !== 1 ? "s" : ""}
        </Text>

        <FlatList
          scrollEnabled={false}
          data={earnings}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item: earning }) => (
            <Animated.View entering={FadeInDown.springify()}>
              <Card style={{ padding: spacing.base }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                    {earning.booking_reference || `Job ${earning.id.slice(0, 8)}`}
                  </Text>
                  <Text style={[type.h3, { color: colors.primary.DEFAULT }]}>
                    {formatCurrency(earning.gross_earnings)}
                  </Text>
                </View>
                {earning.booking_date && (
                  <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm }]}>
                    {new Date(earning.booking_date).toLocaleDateString("en-GB")}
                  </Text>
                )}
                {earning.tip_amount > 0 && (
                  <Text style={[type.bodySmall, { color: colors.accent.DEFAULT, fontWeight: "600" }]}>
                    + {formatCurrency(earning.tip_amount)} tip
                  </Text>
                )}
              </Card>
            </Animated.View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
