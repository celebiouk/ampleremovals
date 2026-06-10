import { Platform, type ViewStyle } from "react-native";

/** Spacing scale — use only these values. */
export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20,
  xl: 24, "2xl": 32, "3xl": 40, "4xl": 48, "5xl": 64,
} as const;

/** Border radius scale. */
export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, full: 999,
} as const;

/**
 * Cross-platform shadow scale (iOS shadow + Android elevation).
 * Spread into a View's style.
 */
function shadow(elevation: number, opacity: number, radius: number, offsetY: number, color = "#0f172a"): ViewStyle {
  return Platform.select({
    ios: { shadowColor: color, shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: offsetY } },
    android: { elevation, shadowColor: color },
    default: {},
  }) as ViewStyle;
}

export const shadows = {
  sm: shadow(2, 0.08, 4, 1),
  md: shadow(4, 0.1, 10, 4),
  lg: shadow(8, 0.12, 18, 10),
  xl: shadow(16, 0.16, 28, 16),
  /** Coloured glow used on primary/accent buttons. */
  primaryGlow: shadow(6, 0.32, 14, 6, "#6b21a8"),
  accentGlow: shadow(6, 0.3, 14, 6, "#16a34a"),
} as const;

/** Minimum touch target (WCAG / HIG). */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TOUCH = 44;
