import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { CloudOff } from "lucide-react-native";
import { colors, radius, spacing, type } from "@/lib/theme";
import { getQueueLength } from "@/lib/offline-queue";

/** Slim banner shown when the device is offline. Reassures the driver that
 *  GPS + actions are being queued and will sync automatically. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => {
      const isOffline = !(s.isConnected ?? true);
      setOffline(isOffline);
      if (isOffline) getQueueLength().then(setQueued);
    });
    return () => sub();
  }, []);

  if (!offline) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.slate[800], borderRadius: radius.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, marginBottom: spacing.base }}>
      <CloudOff size={18} color={colors.white} />
      <Text style={[type.bodySmall, { color: colors.white, flex: 1 }]}>
        You&apos;re offline. {queued > 0 ? `${queued} update${queued === 1 ? "" : "s"} queued — ` : ""}everything will sync when you&apos;re back.
      </Text>
    </View>
  );
}
