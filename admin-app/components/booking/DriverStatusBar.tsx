import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { Navigation, Clock, Package, Truck, CheckCircle2 } from "lucide-react-native";
import { Card } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { colors } from "@/lib/colors";
import { type } from "@/lib/typography";

const STEPS = [
  { status: "on_my_way", label: "On My Way", Icon: Truck, colour: "#7e22ce" },
  { status: "20_mins_away", label: "20 Mins Away", Icon: Clock, colour: "#2563eb" },
  { status: "10_mins_away", label: "10 Mins Away", Icon: Clock, colour: "#d97706" },
  { status: "15_mins_to_delivery", label: "15 Mins to Delivery", Icon: Package, colour: "#ea580c" },
  { status: "job_completed", label: "Job Completed", Icon: CheckCircle2, colour: "#16a34a" },
] as const;

/** Admin-triggered driver-status push — notifies the customer (Email+SMS+WhatsApp). */
export function DriverStatusBar({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function push(status: string, label: string) {
    setBusy(status);
    try {
      await apiFetch("/api/admin/driver-status", {
        method: "POST",
        body: JSON.stringify({ bookingId, status }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success(label, "Customer notified by email, SMS & WhatsApp");
    } catch (e) {
      toast.error("Failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  function onPress(status: string, label: string) {
    if (status === "job_completed") {
      Alert.alert("Mark job completed?", "This notifies the customer the move is done.", [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => push(status, label) },
      ]);
    } else {
      push(status, label);
    }
  }

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Navigation size={18} color={colors.primary.DEFAULT} />
        <Text style={[type.h3, { color: colors.slate[900] }]}>Driver status update</Text>
      </View>
      <Text style={[type.bodySmall, { color: colors.slate[500], marginBottom: 12 }]}>
        Tap to notify the customer where the driver is.
      </Text>
      <View style={{ gap: 8 }}>
        {STEPS.map(({ status, label, Icon, colour }) => (
          <Pressable
            key={status}
            onPress={() => onPress(status, label)}
            disabled={busy === status}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48,
              paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5,
              borderColor: colour, opacity: busy === status ? 0.5 : 1,
            }}
          >
            <Icon size={20} color={colour} />
            <Text style={[type.bodyLargeSemiBold, { color: colour }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
