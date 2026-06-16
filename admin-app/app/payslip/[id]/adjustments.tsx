import { useState } from "react";
import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Trash2, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Button, Input, ScreenHeader, Badge } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { colors } from "@/lib/colors";
import { type as typo } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";

const TYPES = ["bonus", "deduction", "advance", "expense"] as const;

export default function AdjustmentsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const qc = useQueryClient();
  const payslipId = id as string;

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<typeof TYPES[number]>("bonus");
  const [adding, setAdding] = useState(false);

  async function addAdjustment() {
    if (!label || !amount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Missing fields", "Please fill in label and amount");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Invalid amount", "Amount must be a number");
      return;
    }

    setAdding(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await apiFetch(`/api/admin/payslips/${payslipId}/adjustments`, {
        method: "POST",
        body: JSON.stringify({
          type,
          label,
          amount: numAmount,
        }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ["payslip", payslipId] });

      // Reset form
      setLabel("");
      setAmount("");
      setType("bonus");

      // Show confirmation
      Alert.alert("Success", "Adjustment added");
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add adjustment");
    } finally {
      setAdding(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Add adjustment" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[typo.body, { color: colors.slate[600], marginBottom: spacing.base }]}>
            Add a bonus, deduction, advance, or expense to this payslip
          </Text>
        </Animated.View>

        {/* Type selector */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[typo.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Type
          </Text>
          <View style={{ gap: spacing.sm }}>
            {TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setType(t);
                }}
                style={{
                  paddingHorizontal: spacing.base,
                  paddingVertical: spacing.base,
                  borderRadius: radius.lg,
                  backgroundColor: type === t ? colors.primary.DEFAULT : colors.white,
                  borderWidth: 1,
                  borderColor: type === t ? colors.primary.DEFAULT : colors.slate[200],
                }}
              >
                <Text
                  style={[
                    typo.body,
                    {
                      color: type === t ? colors.white : colors.slate[900],
                      fontWeight: "600",
                      textTransform: "capitalize",
                    },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Label input */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
          <Input
            label="Label"
            placeholder="e.g. Performance bonus"
            value={label}
            onChangeText={setLabel}
          />
        </Animated.View>

        {/* Amount input */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginBottom: spacing.lg }}>
          <Input
            label="Amount (£)"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          {amount && (
            <Text style={[typo.bodySmall, { color: colors.slate[600], marginTop: spacing.sm }]}>
              Total: {formatCurrency(parseFloat(amount))}
            </Text>
          )}
        </Animated.View>

        {/* Preview */}
        {label && amount && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base, backgroundColor: colors.slate[50] }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={[typo.bodySemiBold, { color: colors.slate[900] }]}>{label}</Text>
                  <Badge label={type} variant="default" style={{ marginTop: spacing.xs }} />
                </View>
                <Text style={[typo.h3, { color: parseFloat(amount) >= 0 ? colors.accent.DEFAULT : colors.danger.DEFAULT }]}>
                  {parseFloat(amount) >= 0 ? "+" : ""}{formatCurrency(parseFloat(amount))}
                </Text>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Add button */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Button
            label="Add adjustment"
            variant="accent"
            size="lg"
            loading={adding}
            disabled={!label || !amount}
            icon={<Plus size={20} color={colors.white} />}
            onPress={addAdjustment}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
