import { Alert } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Show a confirmation dialog with haptic feedback.
 * Returns true if user confirms, false otherwise.
 */
export async function showConfirm(
  title: string,
  message: string,
  confirmText = "Confirm",
  destructive = false
): Promise<boolean> {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

/**
 * Show an error alert with optional retry callback.
 */
export function showError(
  title: string,
  message: string,
  onRetry?: () => void
) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

  const buttons = [
    { text: "Dismiss", style: "cancel" as const },
  ];

  if (onRetry) {
    buttons.unshift({
      text: "Retry",
      style: "default" as const,
      onPress: onRetry,
    });
  }

  Alert.alert(title, message, buttons);
}

/**
 * Show a success notification.
 */
export function showSuccess(message: string) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  // Toast would go here if available
  console.log("[Success]", message);
}

/**
 * Show a warning alert.
 */
export function showWarning(
  title: string,
  message: string,
  onConfirm?: () => void
) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

  const buttons = [{ text: "OK", style: "default" as const, onPress: onConfirm }];
  Alert.alert(title, message, buttons);
}
