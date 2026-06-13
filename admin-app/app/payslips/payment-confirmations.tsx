import { useEffect, useState } from "react";
import { ScrollView, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CheckCircle2, Banknote, AlertCircle } from "lucide-react-native";
import { Card, ScreenHeader, Skeleton, StatCard } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

interface PaymentConfirmation {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  amount: number;
  payment_method: string;
  paid_date: string;
  confirmation_status: string;
  last_four_digits: string;
  sort_code: string;
}

interface PaymentConfirmations {
  total_payments: number;
  total_paid: number;
  pending_payments: number;
  bank_details_on_file: boolean;
  confirmations: PaymentConfirmation[];
}

export default function PaymentConfirmationsScreen() {
  const router = useRouter();
  const [data, setData] = useState<PaymentConfirmations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfirmations = async () => {
      try {
        const response = await apiFetch("/api/worker/payments/confirmations");
        const result = await response.json();

        if (result.success) {
          setData(result.payment_confirmations);
        }
      } catch (e) {
        console.error("Failed to fetch confirmations:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmations();
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

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
        <ScreenHeader title="Payment Confirmations" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[type.body, { color: colors.slate[600] }]}>No payment data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Payment Confirmations" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        {/* Summary */}
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <StatCard
              icon="CreditCard"
              label="Payments"
              value={String(data.total_payments)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <StatCard
              icon="TrendingUp"
              label="Total"
              value={formatCurrency(data.total_paid)}
              variant="accent"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Bank details */}
        {data.bank_details_on_file && data.confirmations[0] && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.base, marginBottom: spacing.base }}>
                <Banknote size={24} color={colors.primary.DEFAULT} />
                <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>
                  Bank Account
                </Text>
              </View>
              <View style={{ gap: spacing.sm }}>
                <View>
                  <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Account</Text>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                    ••••{data.confirmations[0].last_four_digits}
                  </Text>
                </View>
                {data.confirmations[0].sort_code && (
                  <View>
                    <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Sort Code</Text>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900], marginTop: spacing.xs }]}>
                      {data.confirmations[0].sort_code}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Confirmations list */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Payment History ({data.total_payments})
          </Text>
          <FlatList
            scrollEnabled={false}
            data={data.confirmations}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item: payment }) => (
              <Card style={{ padding: spacing.base }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.base }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {payment.reference}
                    </Text>
                    <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                      {new Date(payment.period_start).toLocaleDateString('en-GB')} –{' '}
                      {new Date(payment.period_end).toLocaleDateString('en-GB')}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[type.h3, { color: colors.accent.DEFAULT }]}>
                      {formatCurrency(payment.amount)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm }}>
                      <CheckCircle2 size={16} color={colors.accent.DEFAULT} />
                      <Text style={[type.bodySmall, { color: colors.accent.DEFAULT, fontWeight: "600" }]}>
                        Confirmed
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: colors.slate[200], paddingTop: spacing.base, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Date Paid</Text>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                      {new Date(payment.paid_date).toLocaleDateString('en-GB')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={[type.bodySmall, { color: colors.slate[600] }]}>Method</Text>
                    <Text style={[type.bodySemiBold, { color: colors.slate[900], textTransform: "capitalize" }]}>
                      {payment.payment_method.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          />
        </Animated.View>

        {/* Help box */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.slate[50], flexDirection: "row", gap: spacing.base }}>
            <AlertCircle size={20} color={colors.slate[600]} />
            <Text style={[type.bodySmall, { color: colors.slate[600], flex: 1 }]}>
              Payments typically appear within 1-2 business days. Contact support if you don't see an expected payment.
            </Text>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
