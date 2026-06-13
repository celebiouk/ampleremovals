import { useState, useEffect } from "react";
import { ScrollView, View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Card, Badge, Skeleton, ErrorState, ScreenHeader, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface CleanerEarning {
  id: string;
  cleaner_id: string;
  gross_earnings: number;
  tip_amount: number;
  status: string;
  created_at: string;
  cleaners: { first_name: string; last_name: string };
  bookings: { reference: string; service_type: string };
}

export default function CleanerEarningsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const [earnings, setEarnings] = useState<CleanerEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ count: 0, gross: 0, tips: 0 });

  useEffect(() => {
    fetchEarnings();
  }, [status]);

  async function fetchEarnings() {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/cleaner-earnings?status=${status}`);
      const data = await response.json();

      if (data.success) {
        setEarnings(data.earnings);
        const gross = data.earnings.reduce(
          (sum: number, e: CleanerEarning) => sum + e.gross_earnings,
          0
        );
        const tips = data.earnings.reduce(
          (sum: number, e: CleanerEarning) => sum + e.tip_amount,
          0
        );
        setTotals({ count: data.count, gross, tips });
      }
    } catch (e) {
      console.error("Failed to fetch cleaner earnings:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Cleaner Earnings" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Status tabs */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {["pending", "approved", "paid"].map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setStatus(s);
                }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.base,
                  borderRadius: 8,
                  backgroundColor: status === s ? colors.primary.DEFAULT : colors.slate[200],
                }}
              >
                <Text
                  style={[
                    type.bodySemiBold,
                    {
                      color: status === s ? colors.white : colors.slate[700],
                      textAlign: "center",
                    },
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Totals */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="Hash"
              label="Count"
              value={String(totals.count)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="Banknote"
              label="Gross"
              value={formatCurrency(totals.gross)}
              variant="accent"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Earnings list */}
        {earnings.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={{ alignItems: "center", marginTop: spacing.xl }}>
            <Text style={[type.h3, { color: colors.slate[600], marginTop: spacing.lg, textAlign: "center" }]}>
              No {status} earnings
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={earnings}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item: earning }) => (
              <Animated.View entering={FadeInDown.springify()}>
                <Card style={{ padding: spacing.base }}>
                  <View style={{ marginBottom: spacing.sm }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {earning.cleaners.first_name} {earning.cleaners.last_name}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                      {earning.bookings.reference} • {earning.bookings.service_type}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View>
                      <Text style={[type.bodySmall, { color: colors.slate[600] }]}>
                        {formatCurrency(earning.gross_earnings)}
                      </Text>
                      {earning.tip_amount > 0 && (
                        <Text style={[type.bodySmall, { color: colors.accent.DEFAULT, fontWeight: "600", marginTop: spacing.xs }]}>
                          + {formatCurrency(earning.tip_amount)} tip
                        </Text>
                      )}
                    </View>
                    <Badge label={earning.status} variant="default" />
                  </View>
                </Card>
              </Animated.View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
