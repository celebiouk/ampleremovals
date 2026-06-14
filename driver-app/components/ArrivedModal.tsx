import { Modal, View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Package, Home } from "lucide-react-native";
import { Button } from "@/components/ui";
import { colors, spacing, type } from "@/lib/theme";

/**
 * The full-screen "You've arrived" takeover (Feature 1, Call 4). Presented when
 * GPS detects the driver is within 80m of the stop. It has a single forward
 * action — confirm the chain of custody — so it can't be casually dismissed.
 */
export function ArrivedModal({
  visible, leg, customerName, onConfirm, onDismiss,
}: { visible: boolean; leg: "pickup" | "delivery"; customerName: string; onConfirm: () => void; onDismiss?: () => void }) {
  const isPickup = leg === "pickup";
  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={() => {}}>
      <LinearGradient colors={[colors.primary.dark, colors.primary.DEFAULT]} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
          <MapPin size={56} color={colors.white} />
        </View>
        <Text style={[type.label, { color: colors.primary.surfaceMid, marginTop: spacing.xl }]}>
          {isPickup ? "Arrived at pickup" : "Arrived at delivery"}
        </Text>
        <Text style={[type.display, { color: colors.white, textAlign: "center", marginTop: spacing.sm }]}>You&apos;ve arrived</Text>
        <Text style={[type.bodyLarge, { color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: spacing.sm, maxWidth: 320 }]}>
          {isPickup
            ? `The customer has been notified you're here. Hand your phone to ${customerName || "the customer"} to begin the pickup confirmation.`
            : `The customer has been notified. Hand your phone to ${customerName || "the recipient"} to confirm the delivery.`}
        </Text>

        <View style={{ position: "absolute", left: spacing.xl, right: spacing.xl, bottom: 48 }}>
          <Button
            label={isPickup ? "Confirm pickup" : "Confirm delivery"}
            variant="accent"
            size="lg"
            icon={isPickup ? <Package size={20} color={colors.white} /> : <Home size={20} color={colors.white} />}
            onPress={onConfirm}
            fullWidth
          />
          {onDismiss ? (
            <Pressable onPress={onDismiss} hitSlop={10} style={{ alignItems: "center", marginTop: spacing.base }}>
              <Text style={[type.bodySemiBold, { color: "rgba(255,255,255,0.7)" }]}>View job details first</Text>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>
    </Modal>
  );
}
