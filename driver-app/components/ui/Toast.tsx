import { useEffect } from "react";
import { Text, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeOut, SlideInUp } from "react-native-reanimated";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react-native";
import { create } from "zustand";
import { colors, radius, shadows, spacing, type } from "@/lib/theme";

type ToastKind = "success" | "error" | "info" | "warning";
interface ToastData { id: number; kind: ToastKind; title: string; subtitle?: string }

interface ToastState {
  current: ToastData | null;
  show: (t: Omit<ToastData, "id">) => void;
  dismiss: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (t) => set({ current: { ...t, id: Date.now() } }),
  dismiss: () => set({ current: null }),
}));

export const toast = {
  success: (title: string, subtitle?: string) => useToastStore.getState().show({ kind: "success", title, subtitle }),
  error: (title: string, subtitle?: string) => useToastStore.getState().show({ kind: "error", title, subtitle }),
  info: (title: string, subtitle?: string) => useToastStore.getState().show({ kind: "info", title, subtitle }),
  warning: (title: string, subtitle?: string) => useToastStore.getState().show({ kind: "warning", title, subtitle }),
};

const CONFIG: Record<ToastKind, { accent: string; Icon: typeof CheckCircle2 }> = {
  success: { accent: colors.accent.DEFAULT, Icon: CheckCircle2 },
  error: { accent: colors.danger.DEFAULT, Icon: AlertCircle },
  warning: { accent: colors.warning.DEFAULT, Icon: AlertTriangle },
  info: { accent: colors.primary.DEFAULT, Icon: Info },
};

/** Rendered once in the root layout. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  if (!current) return null;
  const { accent, Icon } = CONFIG[current.kind];

  return (
    <Animated.View
      key={current.id}
      entering={SlideInUp.springify().damping(20).stiffness(300)}
      exiting={FadeOut.duration(180)}
      style={{ position: "absolute", top: insets.top + spacing.sm, left: spacing.base, right: spacing.base, zIndex: 1000 }}
    >
      <Pressable
        onPress={dismiss}
        accessibilityRole="alert"
        style={[
          {
            flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 56,
            paddingVertical: spacing.md, paddingRight: spacing.base, backgroundColor: colors.white,
            borderRadius: radius.lg, overflow: "hidden",
          },
          shadows.lg,
        ]}
      >
        <View style={{ width: 4, alignSelf: "stretch", backgroundColor: accent }} />
        <Icon size={22} color={accent} />
        <View style={{ flex: 1 }}>
          <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{current.title}</Text>
          {current.subtitle ? <Text style={[type.bodySmall, { color: colors.slate[500] }]}>{current.subtitle}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
