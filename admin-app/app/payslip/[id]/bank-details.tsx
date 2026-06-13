import { useState } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Save } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Button, Input, ScreenHeader, Card } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

export default function BankDetailsScreen() {
  const router = useRouter();
  const { id, workerType, workerId } = useLocalSearchParams();

  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveBankDetails() {
    if (!sortCode || !accountNumber || !accountHolder) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Missing fields", "Please fill in all bank details");
      return;
    }

    // Validate sort code format (UK: 6 digits, usually XX-XX-XX)
    const sortCodeClean = sortCode.replace(/-/g, "");
    if (sortCodeClean.length !== 6 || !/^\d+$/.test(sortCodeClean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Invalid sort code", "Sort code must be 6 digits (e.g., 12-34-56)");
      return;
    }

    // Validate account number (UK: 8 digits)
    if (accountNumber.length !== 8 || !/^\d+$/.test(accountNumber)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Invalid account number", "Account number must be 8 digits");
      return;
    }

    setSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      // Call API to save bank details
      await apiFetch("/api/admin/worker-bank-details", {
        method: "POST",
        body: JSON.stringify({
          worker_type: workerType,
          worker_id: workerId,
          sort_code: sortCode,
          account_number: accountNumber,
          account_holder_name: accountHolder,
        }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Success", "Bank details saved");
      router.back();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save bank details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Bank details" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.body, { color: colors.slate[600], marginBottom: spacing.base }]}>
            Save your bank details for bank-ready payroll exports. Data is encrypted.
          </Text>
        </Animated.View>

        {/* Account holder */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Input
            label="Account holder name"
            placeholder="e.g. John Smith"
            value={accountHolder}
            onChangeText={setAccountHolder}
          />
        </Animated.View>

        {/* Sort code */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
          <Input
            label="Sort code"
            placeholder="e.g. 12-34-56"
            value={sortCode}
            onChangeText={(text) => {
              // Auto-format as XX-XX-XX
              const clean = text.replace(/-/g, "").slice(0, 6);
              const formatted = clean.length > 2
                ? clean.length > 4
                  ? `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`
                  : `${clean.slice(0, 2)}-${clean.slice(2)}`
                : clean;
              setSortCode(formatted);
            }}
            keyboardType="number-pad"
            maxLength={8}
          />
          <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.sm }]}>
            6 digits (auto-formatted)
          </Text>
        </Animated.View>

        {/* Account number */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginBottom: spacing.lg }}>
          <Input
            label="Account number"
            placeholder="e.g. 12345678"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            maxLength={8}
          />
          <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.sm }]}>
            8 digits
          </Text>
        </Animated.View>

        {/* Info box */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
            <Text style={[type.bodySmall, { color: colors.primary.DEFAULT, fontWeight: "600" }]}>
              🔒 Your bank details are encrypted
            </Text>
            <Text style={[type.bodySmall, { color: colors.primary.light, marginTop: spacing.sm }]}>
              Used only for bank-ready CSV exports. Never shared or stored unencrypted.
            </Text>
          </Card>
        </Animated.View>

        {/* Save button */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Button
            label="Save bank details"
            variant="accent"
            size="lg"
            loading={saving}
            icon={<Save size={20} color={colors.white} />}
            onPress={saveBankDetails}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
