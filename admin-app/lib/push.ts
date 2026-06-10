import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { apiFetch } from "./api";

/**
 * Foreground notification behaviour — show the banner even when the app is open.
 * Call once at module load (imported by the root layout).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission and get this device's Expo push token.
 *
 * Returns null (gracefully) when:
 *  - running in a simulator (no push hardware), or
 *  - no EAS projectId is configured yet (set up at launch time).
 *
 * The token should be stored server-side (see "Push notifications" in
 * ADMIN_MOBILE_APP.md) so the backend can target this admin's device.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    // No EAS project yet — remote push isn't available until that's set up.
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    // Store server-side so the backend can target this device.
    try {
      await apiFetch("/api/admin/push-token", {
        method: "POST",
        body: JSON.stringify({ token: token.data, platform: Platform.OS }),
      });
    } catch {
      // Non-fatal — token can be re-sent on next launch.
    }
    return token.data;
  } catch {
    return null;
  }
}
