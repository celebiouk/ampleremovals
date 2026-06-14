import { Platform, type TextStyle, type ViewStyle } from "react-native";

/**
 * Driver-app design tokens — single source of truth. The driver app is a
 * light-mode, high-contrast utility tool used outdoors and one-handed, so the
 * type is large, touch targets are generous, and the brand purple anchors it.
 * Colours are pulled verbatim from the web tailwind config / admin app.
 */
export const colors = {
  primary: {
    DEFAULT: "#6b21a8", // purple-800
    light: "#9333ea", // purple-600
    lighter: "#a855f7", // purple-500
    dark: "#581c87", // purple-900
    surface: "#faf5ff", // purple-50
    surfaceMid: "#f3e8ff", // purple-100
    on: "#ffffff",
  },
  accent: {
    DEFAULT: "#16a34a", // green-600
    light: "#22c55e",
    surface: "#f0fdf4",
    surfaceMid: "#dcfce7",
    on: "#ffffff",
  },
  danger: { DEFAULT: "#dc2626", surface: "#fee2e2", on: "#ffffff" },
  warning: { DEFAULT: "#ca8a04", surface: "#fef9c3" },
  amber: { DEFAULT: "#d97706", surface: "#fef3c7" },
  blue: { DEFAULT: "#2563eb", surface: "#dbeafe" },
  white: "#ffffff",
  black: "#000000",
  bg: "#f6f5f9", // app background — a hair of purple
  slate: {
    900: "#0f172a",
    800: "#1e293b",
    700: "#334155",
    600: "#475569",
    500: "#64748b",
    400: "#94a3b8",
    300: "#cbd5e1",
    200: "#e2e8f0",
    100: "#f1f5f9",
    50: "#f8fafc",
  },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, "2xl": 32, "3xl": 40, "4xl": 56,
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, full: 999 } as const;

export const MIN_TOUCH = 44;

export const shadows = {
  sm: {
    shadowColor: "#1e1b2e", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: "#1e1b2e", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1,
    shadowRadius: 16, elevation: 5,
  } as ViewStyle,
  lg: {
    shadowColor: "#1e1b2e", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16,
    shadowRadius: 28, elevation: 10,
  } as ViewStyle,
  primaryGlow: {
    shadowColor: colors.primary.DEFAULT, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32, shadowRadius: 18, elevation: 8,
  } as ViewStyle,
};

const sys = Platform.select({ ios: "System", android: "sans-serif", default: "System" }) as string;
const sysMedium = Platform.select({ ios: "System", android: "sans-serif-medium", default: "System" }) as string;

/** Type scale. Weights via fontWeight so we avoid extra font packages. */
export const type = {
  display: { fontFamily: sys, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.6 },
  h1: { fontFamily: sys, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.4 },
  h2: { fontFamily: sys, fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -0.2 },
  h3: { fontFamily: sysMedium, fontSize: 18, lineHeight: 24, fontWeight: "700" },
  bodyLarge: { fontFamily: sys, fontSize: 16, lineHeight: 24, fontWeight: "400" },
  bodyLargeSemiBold: { fontFamily: sysMedium, fontSize: 16, lineHeight: 24, fontWeight: "600" },
  body: { fontFamily: sys, fontSize: 14, lineHeight: 20, fontWeight: "400" },
  bodySemiBold: { fontFamily: sysMedium, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  bodySmall: { fontFamily: sys, fontSize: 12, lineHeight: 16, fontWeight: "400" },
  label: { fontFamily: sysMedium, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  button: { fontFamily: sysMedium, fontSize: 16, lineHeight: 20, fontWeight: "700", letterSpacing: 0.2 },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 14, lineHeight: 18 },
} as const satisfies Record<string, TextStyle>;
