import { useState } from "react";
import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Calendar, ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, Button, ScreenHeader, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing, radius } from "@/lib/tokens";

const PRESETS = [
  { label: "This week", days: 7 },
  { label: "Last week", days: 14 },
  { label: "This month", days: 30 },
  { label: "Last month", days: 60 },
];

export default function NewPayRunScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [creating, setCreating] = useState(false);

  function setPreset(days: number) {
    Haptics.selectionAsync().catch(() => {});
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    setPeriodStart(formatDateForInput(start));
    setPeriodEnd(formatDateForInput(end));
  }

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00Z");
    return date.toLocaleDateString("en-GB");
  }

  async function createRun() {
    if (!periodStart || !periodEnd) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Missing dates", "Please select both start and end dates");
      return;
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Invalid dates", "Start date must be before end date");
      return;
    }

    setCreating(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const response = await apiFetch("/api/admin/pay-runs", {
        method: "POST",
        body: JSON.stringify({ periodStart, periodEnd }),
      });

      const data = await response.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        qc.invalidateQueries({ queryKey: ["payRuns"] });
        router.replace(`/payroll/${data.data.runId}`);
      } else {
        throw new Error(data.error || "Failed to create pay run");
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create pay run");
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="New pay run" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.body, { color: colors.slate[600], marginBottom: spacing.base }]}>
            Select a period to generate payslips from approved earnings
          </Text>
        </Animated.View>

        {/* Quick presets */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Quick presets
          </Text>
          <View style={{ gap: spacing.sm }}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.days}
                onPress={() => setPreset(preset.days)}
                style={{
                  paddingHorizontal: spacing.base,
                  paddingVertical: spacing.base,
                  borderRadius: radius.lg,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.slate[200],
                }}
              >
                <Text style={[type.body, { color: colors.primary.DEFAULT, fontWeight: "600" }]}>
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Manual date entry */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900], marginBottom: spacing.base }]}>
            Or select manually
          </Text>
          <Card style={{ padding: spacing.base, gap: spacing.base }}>
            <View>
              <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm, fontWeight: "600" }]}>
                Period start
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
                style={{
                  paddingHorizontal: spacing.base,
                  paddingVertical: spacing.base,
                  borderRadius: radius.md,
                  backgroundColor: colors.slate[50],
                  borderWidth: 1,
                  borderColor: colors.slate[200],
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Calendar size={18} color={colors.primary.DEFAULT} />
                <Text style={[type.body, { color: periodStart ? colors.slate[900] : colors.slate[400], flex: 1 }]}>
                  {periodStart ? formatDateDisplay(periodStart) : "Select date"}
                </Text>
              </Pressable>
              <Input
                placeholder="YYYY-MM-DD"
                value={periodStart}
                onChangeText={setPeriodStart}
                style={{ marginTop: spacing.sm, display: "none" }}
              />
            </View>

            <View>
              <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm, fontWeight: "600" }]}>
                Period end
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
                style={{
                  paddingHorizontal: spacing.base,
                  paddingVertical: spacing.base,
                  borderRadius: radius.md,
                  backgroundColor: colors.slate[50],
                  borderWidth: 1,
                  borderColor: colors.slate[200],
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Calendar size={18} color={colors.primary.DEFAULT} />
                <Text style={[type.body, { color: periodEnd ? colors.slate[900] : colors.slate[400], flex: 1 }]}>
                  {periodEnd ? formatDateDisplay(periodEnd) : "Select date"}
                </Text>
              </Pressable>
              <Input
                placeholder="YYYY-MM-DD"
                value={periodEnd}
                onChangeText={setPeriodEnd}
                style={{ marginTop: spacing.sm, display: "none" }}
              />
            </View>
          </Card>

          {/* Date input fallback (for now, users can type dates directly) */}
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            <View>
              <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.sm, fontWeight: "600" }]}>
                Or type dates (YYYY-MM-DD)
              </Text>
              <Input
                placeholder="Start date"
                value={periodStart}
                onChangeText={setPeriodStart}
                keyboardType="default"
              />
            </View>
            <Input
              placeholder="End date"
              value={periodEnd}
              onChangeText={setPeriodEnd}
              keyboardType="default"
            />
          </View>
        </Animated.View>

        {/* Preview */}
        {periodStart && periodEnd && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
            <Card style={{ padding: spacing.base, backgroundColor: colors.primary.surface }}>
              <Text style={[type.bodySmall, { color: colors.primary.DEFAULT, marginBottom: spacing.sm }]}>
                Preview
              </Text>
              <Text style={[type.bodySemiBold, { color: colors.primary.DEFAULT }]}>
                {formatDateDisplay(periodStart)} – {formatDateDisplay(periodEnd)}
              </Text>
              <Text style={[type.bodySmall, { color: colors.primary.light, marginTop: spacing.sm }]}>
                {Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24))} days
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Create button */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Button
            label="Create pay run"
            variant="primary"
            size="lg"
            loading={creating}
            disabled={!periodStart || !periodEnd}
            onPress={createRun}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
