import { View, ScrollView, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CreditCard, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card, ScreenHeader } from "@/components/ui";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

export default function PaymentsScreen() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(path as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Payments" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        <Text style={[type.bodySmall, { color: colors.slate[600], marginBottom: spacing.lg }]}>
          Manage and view your payment information
        </Text>

        <View style={{ gap: spacing.lg }}>
          <Animated.View entering={FadeInDown.springify()}>
            <Pressable onPress={() => navigateTo("/payslips/payment-confirmations")}>
              <Card style={{ padding: spacing.base, flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.accent.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.base,
                  }}
                >
                  <CreditCard size={24} color={colors.accent.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                    Payment Confirmations
                  </Text>
                  <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                    View all payments & bank details
                  </Text>
                </View>
              </Card>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Pressable onPress={() => navigateTo("/payslips")}>
              <Card style={{ padding: spacing.base, flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.primary.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.base,
                  }}
                >
                  <FileText size={24} color={colors.primary.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                    Payslips
                  </Text>
                  <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                    View earnings & tax information
                  </Text>
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
