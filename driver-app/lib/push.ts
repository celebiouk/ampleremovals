import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiFetch } from "./api";

/**
 * Expo push notifications. Registers this device's token against the signed-in
 * driver so the office/automations can reach them, and shows alerts in the
 * foreground. Best-effort — never throws into the UI.
 */

let cachedToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return; // push needs a physical device

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Job alerts",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#6b21a8",
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenResp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    cachedToken = tokenResp.data;

    await apiFetch("/api/drivers/push-token", { method: "POST", body: JSON.stringify({ token: cachedToken }) });
  } catch {
    // Push is non-critical; ignore failures (e.g. no EAS projectId yet).
  }
}

/** Remove this device's token (call on sign-out). */
export async function unregisterPush(): Promise<void> {
  try {
    if (!cachedToken) return;
    await apiFetch("/api/drivers/push-token", { method: "DELETE", body: JSON.stringify({ token: cachedToken }) });
    cachedToken = null;
  } catch {
    /* ignore */
  }
}
