import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CheckCircle, Calendar } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface Payment {
  id: string;
  net_pay: number;
  payment_method: string;
  paid_at: string;
  pay_runs: { reference: string; period_start: string; period_end: string };
}

interface Summary {
  total_paid: number;
  payment_count: number;
  payment_methods: Record<string, number>;
}

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiFetch("/api/worker/payment-history");
        const data = await response.json();
        if (data.success) {
          setPayments(data.payment_history);
          setSummary(data.summary);
        }
      } catch (e) {
        console.error("Failed to fetch payment history:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Payment History" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Summary */}
        {summary && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base, backgroundColor: colors.accent.surface }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.base }}>
                <CheckCircle size={24} color={colors.accent.DEFAULT} />
                <Text style={[type.bodySemiBold, { color: colors.accent.DEFAULT, marginLeft: spacing.sm }]}>
                  Total Paid
                </Text>
              </View>
              <Text style={[type.display, { color: colors.accent.DEFAULT, fontSize: 32, fontWeight: "bold" }]}>
                {formatCurrency(summary.total_paid)}
              </Text>
              <Text style={[type.bodySmall, { color: colors.accent.light, marginTop: spacing.sm }]}>
                {summary.payment_count} payments received
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Payment list */}
        {payments.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={{ alignItems: "center", marginTop: spacing.xl }}>
            <Calendar size={48} color={colors.slate[300]} />
            <Text style={[type.h3, { color: colors.slate[600], marginTop: spacing.lg, textAlign: "center" }]}>
              No payments yet
            </Text>
          </Animated.View>
        ) : (
          <View>
            <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
              {payments.length} Payment{payments.length !== 1 ? "s" : ""}
            </Text>
            <FlatList
              scrollEnabled={false}
              data={payments}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              renderItem={({ item: payment }) => (
                <Animated.View entering={FadeInDown.springify()}>
                  <Card style={{ padding: spacing.base }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                      <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                        {payment.pay_runs.reference}
                      </Text>
                      <Text style={[type.h3, { color: colors.accent.DEFAULT }]}>
                        {formatCurrency(payment.net_pay)}
                      </Text>
                    </View>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.xs }]}>
                      {new Date(payment.paid_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[500], textTransform: "capitalize" }]}>
                      via {payment.payment_method?.replace("_", " ")}
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
