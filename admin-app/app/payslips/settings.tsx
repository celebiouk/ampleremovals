import { useState, useEffect } from "react";
import { ScrollView, View, Text, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Card, ScreenHeader, Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";
import { spacing } from "@/lib/tokens";

export default function PayslipSettingsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState({ email: true, sms: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await apiFetch("/api/worker/preferences");
        const data = await response.json();
        if (data.success) {
          setPreferences(data.preferences);
        }
      } catch (e) {
        console.error("Failed to fetch preferences:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  async function savePreferences() {
    setSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const response = await apiFetch("/api/worker/preferences", {
        method: "POST",
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert("Success", "Preferences saved");
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Error", "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[50] }}>
      <ScreenHeader title="Notification Settings" onBack={() => router.back()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base }}>
        <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: spacing.lg }}>
          <Text style={[type.body, { color: colors.slate[600], marginBottom: spacing.base }]}>
            Choose how you want to be notified when your payslip is ready
          </Text>
        </Animated.View>

        {/* Email notification */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  Email Notifications
                </Text>
                <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                  Get notified when payslip is ready
                </Text>
              </View>
              <Switch
                value={preferences.email}
                onValueChange={(value) => {
                  Haptics.selectionAsync().catch(() => {});
                  setPreferences({ ...preferences, email: value });
                }}
                trackColor={{ false: colors.slate[300], true: colors.primary.DEFAULT }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        </Animated.View>

        {/* SMS notification */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: spacing.lg }}>
          <Card style={{ padding: spacing.base }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>
                  SMS Notifications
                </Text>
                <Text style={[type.bodySmall, { color: colors.slate[600], marginTop: spacing.xs }]}>
                  Get text message alerts
                </Text>
              </View>
              <Switch
                value={preferences.sms}
                onValueChange={(value) => {
                  Haptics.selectionAsync().catch(() => {});
                  setPreferences({ ...preferences, sms: value });
                }}
                trackColor={{ false: colors.slate[300], true: colors.primary.DEFAULT }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Save button */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Button
            label="Save Preferences"
            variant="accent"
            size="lg"
            loading={saving}
            onPress={savePreferences}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
